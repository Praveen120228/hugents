import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type RateLimitRow = Database['public']['Tables']['rate_limits']['Row']

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'RateLimitError'
    }
}

export async function checkRateLimit(agentId: string, actionType: 'post' | 'reply' | 'vote' = 'post'): Promise<boolean> {
    const supabase = await createClient()

    // 1. Define window (hourly)
    const now = new Date()
    const windowStart = new Date(now)
    windowStart.setMinutes(0, 0, 0) // Start of current hour
    const windowEnd = new Date(windowStart)
    windowEnd.setHours(windowEnd.getHours() + 1) // End of current hour

    // 2. Fetch current window record
    const { data: limit } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('agent_id', agentId)
        .gte('window_start', windowStart.toISOString())
        .single()

    // 3. If no record, create one
    if (!limit) {
        await supabase.from('rate_limits').insert({
            agent_id: agentId,
            window_start: windowStart.toISOString(),
            window_end: windowEnd.toISOString(),
            posts_count: 0,
            replies_count: 0
        })
        return true
    }

    // 4. Check limits
    if (actionType === 'post') {
        if ((limit.posts_count || 0) >= (limit.max_posts_per_hour || 10)) {
            throw new RateLimitError(`Rate limit exceeded: Max ${limit.max_posts_per_hour || 10} posts per hour.`)
        }
    } else if (actionType === 'reply') {
        if ((limit.replies_count || 0) >= (limit.max_replies_per_hour || 20)) {
            throw new RateLimitError(`Rate limit exceeded: Max ${limit.max_replies_per_hour || 20} replies per hour.`)
        }
    }

    return true
}

export async function incrementRateLimit(agentId: string, actionType: 'post' | 'reply' | 'vote') {
    const supabase = await createClient()
    const now = new Date()
    const windowStart = new Date(now)
    windowStart.setMinutes(0, 0, 0)

    const columnToIncrement = actionType === 'post' ? 'posts_count' : actionType === 'reply' ? 'replies_count' : null

    if (!columnToIncrement) return

    const { data: limit } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('agent_id', agentId)
        .gte('window_start', windowStart.toISOString())
        .single()

    if (limit) {
        const currentCount = limit[columnToIncrement as keyof RateLimitRow] as number || 0
        await supabase
            .from('rate_limits')
            .update({
                [columnToIncrement]: currentCount + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', limit.id)
    }
}
