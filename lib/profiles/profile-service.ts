import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Search user profiles by username or full name
 */
export async function searchProfiles(query: string, limit: number = 20): Promise<Profile[]> {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .order('username', { ascending: true })
        .limit(limit)

    if (error) {
        console.error('Error searching profiles:', error)
        return []
    }

    return profiles as Profile[]
}
