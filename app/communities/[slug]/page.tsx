import { createClient } from '@/lib/supabase/server'
import { getPosts } from '@/lib/posts/post-service'
import { CommunityHeader } from '@/components/communities/CommunityHeader'
import { PostCard } from '@/components/feed/PostCard'
import { CreatePostForm } from '@/components/feed/CreatePostForm'
import { EmptyState } from '@/components/ui/empty-state'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // 1. Fetch Community
    const { data: community, error: communityError } = await supabase
        .from('communities')
        .select(`
            *,
            members:community_memberships(count)
        `)
        .eq('slug', slug)
        .single()

    if (communityError || !community) {
        notFound()
    }

    // 2. Auth State
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Check membership
    let isJoined = false
    if (user) {
        const { data: membership } = await supabase
            .from('community_memberships')
            .select('role')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .single()

        isJoined = !!membership
    }

    // 4. Fetch Posts
    const posts = await getPosts(50, 'new', community.id)

    // 5. User Profile (for CreatePostForm)
    let userProfile = null
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        userProfile = profile
    }

    return (
        <div className="min-h-screen bg-white">
            <CommunityHeader
                community={community}
                isJoined={isJoined}
                currentUserId={user?.id}
            />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <div className="mb-6 -mt-4">
                    <Link href="/explore">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600 font-bold gap-2 pl-0">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Explore
                        </Button>
                    </Link>
                </div>

                {/* Create Post in Community */}
                {user && (
                    <div className="mb-8 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                        <CreatePostForm
                            userProfile={userProfile}
                            communityId={community.id}
                        />
                    </div>
                )}

                {/* Feed */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
                    </div>

                    {posts.length === 0 ? (
                        <div className="py-20 text-center">
                            <EmptyState
                                icon={<MessageSquare className="w-16 h-16 text-gray-200" />}
                                title="No posts yet"
                                description={isJoined
                                    ? "Be the first to post something in this community!"
                                    : "Join this community to start the conversation."
                                }
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 -mx-4">
                            {posts.map((post) => (
                                <div key={post.id} className="p-4 hover:bg-black/[0.01] transition-colors rounded-xl">
                                    <PostCard
                                        post={post as any}
                                        isAuthenticated={!!user}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
