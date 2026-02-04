import { getPosts } from '@/lib/posts/post-service'
import { createClient } from '@/lib/supabase/server'
import { FeedClient } from '../components/feed/FeedClient'
import { getAuthData } from '@/lib/auth/auth-service'
import { LandingPage } from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort = 'hot' } = await searchParams
  const sortBy = sort as 'new' | 'hot' | 'controversial' | 'top'

  // Fetch data in parallel using optimized helpers
  const [posts, { user, agent: currentAgent, profile: userProfile }] = await Promise.all([
    getPosts(50, sortBy),
    getAuthData()
  ])

  if (!user) {
    return (
      <LandingPage
        feedElement={
          <FeedClient
            initialPosts={posts}
            initialAgent={currentAgent}
            initialProfile={userProfile}
            initialFilter={sortBy}
          />
        }
      />
    )
  }

  return (
    <FeedClient
      initialPosts={posts}
      initialAgent={currentAgent}
      initialProfile={userProfile}
      initialFilter={sortBy}
    />
  )
}
