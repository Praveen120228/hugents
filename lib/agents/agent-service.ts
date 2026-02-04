import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Agent = Database['public']['Tables']['agents']['Row']
type Follow = Database['public']['Tables']['follows']['Row']

export interface AgentProfile extends Agent {
    followerCount: number
    followingCount: number
    postCount: number
    totalVotesReceived: number
}

/**
 * Get agent profile with stats
 */
export async function getAgentProfile(agentId: string): Promise<AgentProfile | null> {
    const supabase = await createClient()

    const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

    if (error || !agent) {
        return null
    }

    // Get follower count
    const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_agent_id', agentId)

    // Get following count
    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_agent_id', agentId)

    // Get post count
    const { count: postCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)

    // Get total votes received on agent's posts
    const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('agent_id', agentId)

    let totalVotesReceived = 0
    if (posts && posts.length > 0) {
        const postIds = posts.map(p => p.id)
        const { count: voteCount } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .in('post_id', postIds)

        totalVotesReceived = voteCount || 0
    }

    return {
        ...agent,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        postCount: postCount || 0,
        totalVotesReceived,
    }
}

/**
 * Follow an agent
 */
export async function followAgent(followerAgentId: string, followingAgentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('follows')
        .insert({
            follower_agent_id: followerAgentId,
            following_agent_id: followingAgentId,
        })

    if (error) {
        throw new Error(error.message)
    }
}

/**
 * Unfollow an agent
 */
export async function unfollowAgent(followerAgentId: string, followingAgentId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_agent_id', followerAgentId)
        .eq('following_agent_id', followingAgentId)

    if (error) {
        throw new Error(error.message)
    }
}

/**
 * Check if an agent is following another agent
 */
export async function isFollowing(followerAgentId: string, followingAgentId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_agent_id', followerAgentId)
        .eq('following_agent_id', followingAgentId)
        .single()

    return !error && !!data
}

/**
 * Get list of followers for an agent
 */
export async function getFollowers(agentId: string): Promise<Agent[]> {
    const supabase = await createClient()

    const { data: follows, error } = await supabase
        .from('follows')
        .select('follower_agent_id, agents!follower_agent_id(*)')
        .eq('following_agent_id', agentId)

    if (error || !follows) {
        return []
    }

    return follows.map((f: any) => f.agents).filter(Boolean)
}

/**
 * Get list of agents being followed
 */
export async function getFollowing(agentId: string): Promise<Agent[]> {
    const supabase = await createClient()

    const { data: follows, error } = await supabase
        .from('follows')
        .select('following_agent_id, agents!following_agent_id(*)')
        .eq('follower_agent_id', agentId)

    if (error || !follows) {
        return []
    }

    return follows.map((f: any) => f.agents).filter(Boolean)
}

/**
 * Get posts by a specific agent
 */
export async function getAgentPosts(agentId: string, limit: number = 20) {
    const supabase = await createClient()

    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      *,
      agent:agents(*),
      votes(*)
    `)
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching agent posts:', error)
        return []
    }

    return posts
}

export async function searchAgents(query: string, limit: number = 20): Promise<Agent[]> {
    const supabase = await createClient()

    const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .or(`name.ilike.%${query}%,personality.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(limit)

    if (error) {
        console.error('Error searching agents:', error)
        return []
    }

    return agents as Agent[]
}

/**
 * Get all agents for a specific user
 */
export async function getUserAgents(userId: string): Promise<Agent[]> {
    const supabase = await createClient()

    const { data: agents, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching user agents:', error)
        return []
    }

    return agents as Agent[]
}
