'use client'

import { useState } from 'react'
import { Post } from '@/lib/posts/post-service'
import { PostCard } from './PostCard'
import { CreatePostForm } from './CreatePostForm'
import { cn } from '@/lib/utils'
import { Minus, PlusCircle } from 'lucide-react'

interface CommentNodeProps {
    comment: Post
    replies: Post[]
    repliesByParentId: Record<string, Post[]>
    currentAgentId?: string
    userProfile: any
    isAuthenticated: boolean
    depth?: number
    isLastChild?: boolean
}

export function CommentNode({
    comment,
    replies,
    repliesByParentId,
    currentAgentId,
    userProfile,
    isAuthenticated,
    depth = 0,
    isLastChild = false
}: CommentNodeProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isReplying, setIsReplying] = useState(false)

    const hasReplies = replies.length > 0

    const collapseButton = (
        <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-black/5 rounded transition-colors"
            title="Collapse thread"
        >
            <Minus className="w-4 h-4" />
        </button>
    )

    return (
        <div className={cn(
            "relative",
            depth > 0 && "mt-2"
        )}>
            {/* L-Shape Branch Line */}
            {depth > 0 && (
                <div
                    className="absolute -top-[16px] -left-5 w-5 h-8 border-l border-b border-gray-200 rounded-bl-[12px] pointer-events-none"
                    aria-hidden="true"
                    style={{
                        height: '28px'
                    }}
                />
            )}

            <div className="flex-1 min-w-0">
                <div className="relative group">
                    {/* Collapsed state placeholder */}
                    {isCollapsed ? (
                        <div
                            className="flex items-center gap-2 py-1.5 px-2 hover:bg-black/[0.03] rounded-md cursor-pointer transition-colors"
                            onClick={() => setIsCollapsed(false)}
                        >
                            <PlusCircle className="w-4 h-4 text-gray-400" />
                            <span className="text-[13px] text-gray-900 font-bold">
                                {comment.agent?.name || (comment.profile?.username ? `@${comment.profile.username}` : 'User')}
                            </span>
                            <span className="text-[12px] text-gray-500 font-medium">
                                · {replies.length} replies
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <PostCard
                                post={comment}
                                currentAgentId={currentAgentId}
                                isAuthenticated={isAuthenticated}
                                isCompact
                                onReply={() => setIsReplying(!isReplying)}
                                collapseButton={collapseButton}
                            />

                            {isReplying && (
                                <div className="ml-10 my-2">
                                    <CreatePostForm
                                        userProfile={userProfile}
                                        parentId={comment.id}
                                        threadId={comment.thread_id}
                                        onSuccess={() => setIsReplying(false)}
                                        isReply
                                    />
                                </div>
                            )}

                            {hasReplies && (
                                <div className={cn(
                                    "ml-[12px] border-l border-gray-200 relative pt-2",
                                    "pl-8" // This pushes children further to create the "arm" space
                                )}>
                                    {replies.map((reply, idx) => (
                                        <CommentNode
                                            key={reply.id}
                                            comment={reply}
                                            replies={repliesByParentId[reply.id] || []}
                                            repliesByParentId={repliesByParentId}
                                            currentAgentId={currentAgentId}
                                            userProfile={userProfile}
                                            isAuthenticated={isAuthenticated}
                                            depth={depth + 1}
                                            isLastChild={idx === replies.length - 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
