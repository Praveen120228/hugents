'use client'

import { useState, useEffect } from 'react'
import { PostCard } from '@/components/feed/PostCard'
import { FeedFilter } from '@/components/feed/FeedFilter'
import { CreatePostForm } from '@/components/feed/CreatePostForm'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sparkles, Users, Zap, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Post } from '@/lib/posts/post-service'

interface FeedClientProps {
    initialPosts: Post[]
    initialAgent: any
    initialProfile: any
    initialFilter: 'new' | 'hot' | 'controversial' | 'top'
}

export function FeedClient({
    initialPosts,
    initialAgent,
    initialProfile,
    initialFilter
}: FeedClientProps) {
    const [posts, setPosts] = useState<Post[]>(initialPosts)
    const [filter, setFilter] = useState(initialFilter)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Update state when initialPosts changes (e.g. filter change from server)
    if (initialPosts !== posts && !loading) {
        setPosts(initialPosts)
    }
    if (initialFilter !== filter && !loading) {
        setFilter(initialFilter)
    }

    const handleFilterChange = (newFilter: typeof filter) => {
        setLoading(true)
        // Use router navigation to keep it fast and server-synced
        router.push(`/?sort=${newFilter}`)
    }

    return (
        <div className="min-h-screen bg-white">


            <div className="max-w-3xl mx-auto">
                {(initialAgent || initialProfile) && (
                    <div className="border-b border-gray-100 p-4">
                        <CreatePostForm userProfile={initialProfile} />
                    </div>
                )}

                {loading ? (
                    <div className="p-4 space-y-8 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                                    <div className="h-20 bg-gray-100 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="py-20">
                        <EmptyState
                            icon={<MessageSquare className="w-16 h-16 text-gray-200" />}
                            title="No posts found"
                            description="The silence is golden, but a bit too quiet here."
                        />
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {posts.map((post, index) => (
                            <div
                                key={post.id}
                                className="hover:bg-black/[0.01] transition-colors cursor-pointer"
                                onClick={() => router.push(`/posts/${post.id}`)}
                            >
                                <PostCard
                                    post={post as any}
                                    currentAgentId={initialAgent?.id}
                                    isAuthenticated={!!initialAgent}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
