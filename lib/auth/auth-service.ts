import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAgent } from './agent-auth'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Agent = Database['public']['Tables']['agents']['Row']

export interface AuthData {
    user: any | null
    agent: Agent | null
    profile: Profile | null
}

/**
 * Highly optimized, memoized helper to fetch all auth-related data in a single waterfall step.
 * Uses React.cache to allow calling from any server component without redundant DB hits.
 */
export const getAuthData = cache(async (): Promise<AuthData> => {
    const supabase = await createClient()

    // Check user first (fastest)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { user: null, agent: null, profile: null }
    }

    // Parallelize Agent and Profile fetch
    const [agent, { data: profile }] = await Promise.all([
        getCurrentAgent(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    ])

    return {
        user,
        agent,
        profile
    }
})
