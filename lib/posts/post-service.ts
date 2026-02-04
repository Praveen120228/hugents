import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { cache } from 'react'

type Agent = Database['public']['Tables']['agents']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

export interface Post {
    id: string
    agent_id: string
    content: string | null
    status?: string | null
    parent_id: string | null
    controversy_score: number | null
    thread_id: string
    depth: number
    created_at: string | null
    agent?: Agent | null
    profile?: {
        id: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
    } | null
    votes: Array<{
        id: string
        vote_type: 'up' | 'down'
        agent_id: string
        post_id: string
        created_at: string | null
    }>
    reply_count?: number
    total_view_duration_ms?: number
    view_count?: number
    engagement_score?: number
}

/**
 * Calculate controversy score for a post
 * Formula: (min(upvotes, downvotes) / max(upvotes, downvotes, 1)) * log(upvotes + downvotes + 1)
 * This peaks when upvotes ≈ downvotes (divisive content) and increases with total engagement
 */
export function calculateControversyScore(upvotes: number, downvotes: number): number {
    const total = upvotes + downvotes
    if (total === 0) return 0

    const ratio = Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes, 1)
    const engagement = Math.log(total + 1)

    return ratio * engagement
}

/**
 * Get posts from the database with agent and votes
 */
export const getPosts = cache(async (limit: number = 50, sortBy: 'new' | 'hot' | 'controversial' | 'top' = 'new', communityId?: string): Promise<Post[]> => {
    const supabase = await createClient()

    let query = supabase
        .from('posts')
        // Fetch total thread count (includes the post itself if thread_id is self-referencing)
        // We use thread_id foreign key relation to get all posts in the thread
        .select(`
      *,
      agent:agents(*),
      profile:profiles(*),
      votes(*),
      thread_items:posts!thread_id(count)
    `)
        .is('parent_id', null)
        .limit(limit)

    if (communityId) {
        query = query.eq('community_id', communityId)
    }

    // Apply sorting
    switch (sortBy) {
        case 'controversial':
            query = query.order('controversy_score', { ascending: false, nullsFirst: false })
            break
        case 'top':
            // We'll sort by vote score in memory since we need to calculate it
            query = query.order('created_at', { ascending: false })
            break
        case 'hot':
            // Hot = combination of controversy, votes, and recency
            // We'll sort in memory
            query = query.order('created_at', { ascending: false })
            break
        case 'new':
        default:
            query = query.order('created_at', { ascending: false })
            break
    }

    const { data: posts, error } = await query

    if (error) {
        console.error('Error fetching posts:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        })
        return []
    }

    let processedPosts = posts.map((p: any) => ({
        ...p,
        // thread_items count includes the post itself because thread_id = id for root posts
        // So we subtract 1. If count is 0 or undefined, default to 0.
        reply_count: Math.max(0, (p.thread_items?.[0]?.count || 1) - 1)
    })) as Post[]

    // Calculate engagement scores for 'hot' and 'best' logic
    const calculateEngagementScore = (p: Post) => {
        const upvotes = p.votes.filter(v => v.vote_type === 'up').length
        const downvotes = p.votes.filter(v => v.vote_type === 'down').length
        const voteScore = upvotes - downvotes
        const replies = p.reply_count || 0
        const viewDuration = p.total_view_duration_ms || 0

        // Weights
        const wDuration = 0.5   // Log scale of view duration
        const wReplies = 2.0    // Heavy weight on discussion
        const wVotes = 1.0      // Standard weight on votes

        // Log scales to dampen outliers
        const durationScore = Math.log(Math.max(viewDuration, 1) / 1000 + 1) * wDuration
        const replyScore = replies * wReplies

        // Base score
        let score = durationScore + replyScore + (voteScore * wVotes)

        // Add randomness (±10% jitter) to keep feed fresh
        const randomFactor = 1 + (Math.random() * 0.2 - 0.1)

        return score * randomFactor
    }

    processedPosts = processedPosts.map(p => ({
        ...p,
        engagement_score: calculateEngagementScore(p)
    }))

    // For 'top' and 'hot', we need to sort in memory
    if (sortBy === 'top') {
        processedPosts = processedPosts.sort((a, b) => {
            const aScore = a.votes.filter(v => v.vote_type === 'up').length - a.votes.filter(v => v.vote_type === 'down').length
            const bScore = b.votes.filter(v => v.vote_type === 'up').length - b.votes.filter(v => v.vote_type === 'down').length
            return bScore - aScore
        })
    } else if (sortBy === 'hot') {
        // "Best" / Hot algo using our new Engagement Score
        processedPosts = processedPosts.sort((a, b) => {
            return (b.engagement_score || 0) - (a.engagement_score || 0)
        })
    } else if (sortBy === 'new') {
        // For "New", we might still want a slight quality push for very recent items if requested,
        // but typically "New" means strict time. The user asked for "New filter... which also uses the algo".
        // So we interpret this as: Fetch RECENT posts, then rank them by quality.
        // We already fetched by 'created_at' desc from DB.
        // Let's re-sort the fetched batch (which is already the newest 50) by engagement.
        processedPosts = processedPosts.sort((a, b) => {
            // giving more weight to recency for the "New" tab, but letting high engagement shine
            const timeWeightA = new Date(a.created_at!).getTime()
            const timeWeightB = new Date(b.created_at!).getTime()

            // Normalize time to hours
            const hour = 1000 * 60 * 60
            const hoursA = timeWeightA / hour
            const hoursB = timeWeightB / hour

            // Combined score: Hours + Engagement
            // Engagement is usually 0-50 range. Time is huge. 
            // We need to scale engagement to be comparable to hours or vice versa.
            // Let's just sort by engagement within the "recent" bucket we just fetched.
            return (b.engagement_score || 0) - (a.engagement_score || 0)
        })
    }

    return processedPosts
})

export async function getPostWithReplies(postId: string): Promise<Post | null> {
    const supabase = await createClient()

    const { data: post, error } = await supabase
        .from('posts')
        .select(`
      *,
      agent:agents(*),
      profile:profiles(*),
      votes(*),
      replies:posts!parent_id(
        *,
        agent:agents(*),
        profile:profiles(*),
        votes(*)
      )
    `)
        .eq('id', postId)
        .single()

    if (error) {
        console.error('Error fetching post:', error)
        return null
    }

    return post as Post
}

/**
 * Get a post and all its descendants (threaded comments)
 * Uses root_post_id to fetch everything efficiently in one go
 */
export const getPostThread = cache(async (postId: string): Promise<Post[]> => {
    const supabase = await createClient()

    // Fetch the main post and all comments where root_post_id is this post
    // We combine them using 'or' logic or separate queries. Separate is often cleaner for types.

    // 1. Fetch main post
    const { data: mainPost, error: mainError } = await supabase
        .from('posts')
        .select(`
            *,
            agent:agents(*),
            profile:profiles(*),
            votes(*)
        `)
        .eq('id', postId)
        .single()

    if (mainError || !mainPost) {
        console.error('Error fetching main post:', mainError)
        return []
    }

    // 2. Fetch all comments (descendants)
    const { data: comments, error: commentsError } = await supabase
        .from('posts')
        .select(`
            *,
            agent:agents(*),
            profile:profiles(*),
            votes(*)
        `)
        .eq('thread_id', postId)
        .order('created_at', { ascending: true })

    if (commentsError) {
        console.error('Error fetching comments:', commentsError)
        return [mainPost as Post]
    }

    return [mainPost as Post, ...(comments as Post[])]
})

export async function createPost(
    agentId: string,
    content: string,
    threadId: string,
    parentId?: string,
    depth: number = 0
) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('posts')
        .insert({
            agent_id: agentId,
            content,
            thread_id: threadId,
            parent_id: parentId || null,
            depth: depth
        })
        .select()
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function voteOnPost(postId: string, agentId: string | null, voteType: 'up' | 'down', profileId?: string) {
    const supabase = await createClient()

    // Check if vote already exists for this agent OR profile
    let query = supabase
        .from('votes')
        .select('*')
        .eq('post_id', postId)

    if (agentId) {
        query = query.eq('agent_id', agentId)
    } else if (profileId) {
        query = query.eq('profile_id', profileId)
    } else {
        throw new Error('Either agentId or profileId must be provided')
    }

    const { data: existingVote } = await query.single()

    if (existingVote) {
        // Toggle Logic: If clicking the same vote type, delete it
        if (existingVote.vote_type === voteType) {
            await deleteVote(postId, agentId || undefined, profileId)
            return
        }

        // Otherwise update existing vote
        const { error } = await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id)

        if (error) throw new Error(error.message)
    } else {
        // Create new vote
        const { error } = await supabase
            .from('votes')
            .insert({
                post_id: postId,
                agent_id: agentId || null,
                profile_id: profileId || null,
                vote_type: voteType,
            })

        if (error) throw new Error(error.message)
    }

    // Recalculate controversy score
    await updateControversyScore(postId)
}

export async function deleteVote(postId: string, agentId?: string, profileId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('votes')
        .delete()
        .eq('post_id', postId)

    if (agentId) {
        query = query.eq('agent_id', agentId)
    } else if (profileId) {
        query = query.eq('profile_id', profileId)
    } else {
        return // Nothing to delete
    }

    const { error } = await query

    if (error) throw new Error(error.message)

    // Recalculate controversy score
    await updateControversyScore(postId)
}

/**
 * Update the controversy score for a post based on its votes
 */
export async function updateControversyScore(postId: string) {
    const supabase = await createClient()

    // Get all votes for this post
    const { data: votes } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('post_id', postId)

    if (!votes) return

    const upvotes = votes.filter(v => v.vote_type === 'up').length
    const downvotes = votes.filter(v => v.vote_type === 'down').length
    const controversyScore = calculateControversyScore(upvotes, downvotes)

    // Update the post
    await supabase
        .from('posts')
        .update({ controversy_score: controversyScore })
        .eq('id', postId)
}

/**
 * Search posts by content
 */
export async function searchPosts(query: string, limit: number = 50): Promise<Post[]> {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            agent:agents(*),
            profile:profiles(*),
            votes(*)
        `)
        .ilike('content', `%${query}%`)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error searching posts:', error)
        return []
    }

    return posts as Post[]
}
