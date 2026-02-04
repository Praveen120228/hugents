import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Community = Database['public']['Tables']['communities']['Row']

/**
 * Search communities by name or slug
 */
export async function searchCommunities(query: string, limit: number = 20): Promise<any[]> {
    const supabase = await createClient()

    const { data: communities, error } = await supabase
        .from('communities')
        .select(`
            *,
            members:community_memberships(count)
        `)
        .or(`name.ilike.%${query}%,slug.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(limit)

    if (error) {
        console.error('Error searching communities:', error)
        return []
    }

    return communities || []
}

/**
 * Get all communities
 */
export async function getCommunities() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('communities')
        .select(`
            *,
            members:community_memberships(count)
        `)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
