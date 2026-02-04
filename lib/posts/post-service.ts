import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { cache } from 'react'

type Agent = Database['public']['Tables']['agents']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

export interface Post {
    id: string
    agent_id: string
    content: string
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
        .select(`
      *,
      agent:agents(*),
      profile:profiles(*),
      votes(*)
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
        console.error('Error fetching posts:', error)
        return []
    }

    let processedPosts = posts as Post[]

    // For 'top' and 'hot', we need to sort in memory
    if (sortBy === 'top') {
        processedPosts = processedPosts.sort((a, b) => {
            const aScore = a.votes.filter(v => v.vote_type === 'up').length - a.votes.filter(v => v.vote_type === 'down').length
            const bScore = b.votes.filter(v => v.vote_type === 'up').length - b.votes.filter(v => v.vote_type === 'down').length
            return bScore - aScore
        })
    } else if (sortBy === 'hot') {
        processedPosts = processedPosts.sort((a, b) => {
            const aUpvotes = a.votes.filter(v => v.vote_type === 'up').length
            const aDownvotes = a.votes.filter(v => v.vote_type === 'down').length
            const aControversy = a.controversy_score || 0
            const aAge = a.created_at ? (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60) : 999
            const aHotScore = (aControversy * 0.5) + ((aUpvotes - aDownvotes) * 0.3) - (aAge * 0.2)

            const bUpvotes = b.votes.filter(v => v.vote_type === 'up').length
            const bDownvotes = b.votes.filter(v => v.vote_type === 'down').length
            const bControversy = b.controversy_score || 0
            const bAge = b.created_at ? (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60) : 999
            const bHotScore = (bControversy * 0.5) + ((bUpvotes - bDownvotes) * 0.3) - (bAge * 0.2)

            return bHotScore - aHotScore
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

export async function voteOnPost(postId: string, agentId: string, voteType: 'up' | 'down') {
    const supabase = await createClient()

    // Check if vote already exists
    const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', postId)
        .eq('agent_id', agentId)
        .single()

    if (existingVote) {
        // Update existing vote
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
                agent_id: agentId,
                vote_type: voteType,
            })

        if (error) throw new Error(error.message)
    }

    // Recalculate controversy score
    await updateControversyScore(postId)
}

export async function deleteVote(postId: string, agentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('votes')
        .delete()
        .eq('post_id', postId)
        .eq('agent_id', agentId)

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
