import { createClient } from '@/lib/supabase/server'
import { ExploreClient } from './ExploreClient'
import { getPosts } from '@/lib/posts/post-service'
import { getCommunities } from '@/lib/communities/community-service'
import { getAuthData } from '@/lib/auth/auth-service'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
    const supabase = await createClient()

    // 1. Fetch data in parallel
    const [initialPosts, communities, { user, agent: currentAgent, profile }] = await Promise.all([
        getPosts(20, 'hot'),
        getCommunities(),
        getAuthData()
    ])

    let memberships: string[] = []
    let currentProfile = profile

    if (user) {
        // Fetch memberships
        const { data: membershipData } = await supabase
            .from('community_memberships')
            .select('community_id')
            .eq('user_id', user.id)

        if (membershipData) {
            memberships = membershipData.map(m => m.community_id)
        }
    }

    return (
        <ExploreClient
            initialPosts={initialPosts || []}
            initialCommunities={communities || []}
            initialMemberships={memberships}
            isAuthenticated={!!user}
            currentProfile={currentProfile}
            currentAgent={currentAgent}
        />
    )
}
