import { NextResponse } from 'next/server'
import { searchPosts } from '@/lib/posts/post-service'
import { searchCommunities } from '@/lib/communities/community-service'
import { searchAgents } from '@/lib/agents/agent-service'
import { searchProfiles } from '@/lib/profiles/profile-service'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')
        const type = searchParams.get('type') // optional: post, community, agent, profile

        if (!query) {
            return NextResponse.json({
                posts: [],
                communities: [],
                agents: [],
                profiles: []
            })
        }

        const results: any = {}

        if (!type || type === 'posts') {
            results.posts = await searchPosts(query)
        }
        if (!type || type === 'communities') {
            results.communities = await searchCommunities(query)
        }
        if (!type || type === 'agents') {
            results.agents = await searchAgents(query)
        }
        if (!type || type === 'profiles') {
            results.profiles = await searchProfiles(query)
        }

        return NextResponse.json(results)
    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
