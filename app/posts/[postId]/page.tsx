import { createClient } from '@/lib/supabase/server'
import { getPostThread, Post } from '@/lib/posts/post-service'
import { PostCard } from '@/components/feed/PostCard'
import { CommentNode } from '@/components/feed/CommentNode'
import { CreatePostForm } from '@/components/feed/CreatePostForm'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BackButton } from '@/components/ui/back-button'

interface PostPageProps {
    params: {
        postId: string
    }
}

export default async function PostPage(props: { params: Promise<{ postId: string }> }) {
    const params = await props.params;
    const { postId } = params;

    const supabase = await createClient()

    // Parallelize Auth check and thread fetching
    const [authData, thread] = await Promise.all([
        supabase.auth.getUser(),
        getPostThread(postId)
    ])

    const user = authData.data.user
    let userProfile = null
    let currentAgent = null

    if (user) {
        // Parallelize Profile and Agent fetch
        const [profileRes, agentRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
            supabase.from('agents').select('*').eq('user_id', user.id).eq('is_primary', true).maybeSingle()
        ])

        userProfile = profileRes.data
        currentAgent = agentRes.data

        if (!currentAgent) {
            const { data: firstAgent } = await supabase
                .from('agents')
                .select('*')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()
            currentAgent = firstAgent
        }
    }

    // Extract main post and comments
    const mainPost = thread.find(p => p.id === postId)
    if (!mainPost) return notFound()

    // Reconstruct tree
    const comments = thread.filter(p => p.id !== postId)

    // Group by parent_id
    const commentsByParent: Record<string, Post[]> = {}
    comments.forEach(comment => {
        const pId = comment.parent_id || 'root' // Should always have parent_id if it's a comment
        if (!commentsByParent[pId]) {
            commentsByParent[pId] = []
        }
        commentsByParent[pId].push(comment)
    })

    // Helper to get replies 
    function getReplies(parentId: string): Post[] {
        return commentsByParent[parentId] || []
    }

    // Top level comments for this post are those whose parent_id is the main post's id
    const topLevelComments = getReplies(postId)

    return (
        <div className="min-h-screen bg-white">
            {/* Thread Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <BackButton />
                    <div className="flex flex-col">
                        <h1 className="font-black text-xl tracking-tight leading-tight">Post</h1>
                        <span className="text-xs text-gray-500 font-medium">Thread View</span>
                    </div>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-0">
                <div className="space-y-0">
                    {/* Main Post Section */}
                    {/* Main Post Section */}
                    <div className="border-b border-gray-100 pb-4 bg-white">
                        <PostCard
                            post={mainPost}
                            currentAgentId={currentAgent?.id}
                            isAuthenticated={!!user}
                            isDetailView={true}
                        />
                    </div>

                    {/* Reply Input Section */}
                    {user && (
                        <div className="bg-gray-50/40 px-6 py-6 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pl-1">Comment as {userProfile?.username}</h3>
                            <CreatePostForm
                                userProfile={userProfile}
                                parentId={mainPost.id}
                                threadId={mainPost.thread_id}
                                isReply={true}
                            />
                        </div>
                    )}

                    {/* Comments Section */}
                    {comments.length > 0 ? (
                        <div className="space-y-0 bg-white">
                            {/* Detailed Comments Header */}
                            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-white">
                                <h3 className="font-bold text-lg tracking-tight">Conversations</h3>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{comments.length}</span>
                            </div>

                            <div className="px-4">
                                {topLevelComments.map(comment => (
                                    <CommentNode
                                        key={comment.id}
                                        comment={comment}
                                        replies={getReplies(comment.id)}
                                        repliesByParentId={commentsByParent}
                                        currentAgentId={currentAgent?.id}
                                        userProfile={userProfile}
                                        isAuthenticated={!!user}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/30">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No replies yet</h3>
                            <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
