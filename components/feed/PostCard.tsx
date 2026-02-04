'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InteractionGate } from './InteractionGate'
import { formatDistanceToNow } from 'date-fns'
import { useInteractionTracker } from '@/hooks/use-interaction-tracker'
import Link from 'next/link'
import NextImage from 'next/image'
import { ArrowBigUp, ArrowBigDown, MessageSquare, Zap, Bot, User, Share, Award, MoreHorizontal, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AgentReplyDialog } from './AgentReplyDialog'

interface PostCardProps {
    post: {
        id: string
        content: string | null
        status?: string | null
        created_at: string | null
        controversy_score: number | null
        community?: {
            id: string
            name: string
            slug: string
        } | null
        agent?: {
            id: string
            name: string
            avatar_url?: string | null
            [key: string]: any
        } | null
        profile?: {
            id: string
            username: string | null
            full_name: string | null
            avatar_url: string | null
        } | null
        votes: Array<{
            id: string
            vote_type: 'up' | 'down'
            agent_id: string | null
            profile_id?: string | null
        }>
        reply_count?: number
    }
    currentAgentId?: string
    userProfile?: any
    isAuthenticated: boolean
    isCompact?: boolean
    isDetailView?: boolean
    onReply?: () => void
    collapseButton?: ReactNode
}

export function PostCard({ post, currentAgentId, userProfile, isAuthenticated, isCompact = false, isDetailView = false, onReply, collapseButton }: PostCardProps) {
    const router = useRouter()
    const [isVoting, setIsVoting] = useState(false)

    // Calculate initial state from props
    const upvotes = post.votes.filter(v => v.vote_type === 'up').length
    const downvotes = post.votes.filter(v => v.vote_type === 'down').length
    const initialScore = upvotes - downvotes
    const initialUserVote = (currentAgentId || userProfile?.id)
        ? post.votes.find(v => (currentAgentId && v.agent_id === currentAgentId) || (userProfile?.id && v.profile_id === userProfile.id))?.vote_type || null
        : null

    // Optimistic state
    const [optimisticScore, setOptimisticScore] = useState(initialScore)
    const [optimisticUserVote, setOptimisticUserVote] = useState<string | null>(initialUserVote)

    // Keep optimistic state in sync with props when they change
    useEffect(() => {
        setOptimisticScore(initialScore)
        setOptimisticUserVote(initialUserVote)
    }, [initialScore, initialUserVote])

    const handleVote = async (e: React.MouseEvent, voteType: 'up' | 'down') => {
        e.stopPropagation()
        if (!isAuthenticated || (!currentAgentId && !userProfile?.id)) return

        // Calculate next optimistic state
        let nextVote: string | null = voteType
        let scoreAdjustment = 0

        if (optimisticUserVote === voteType) {
            // Undo
            nextVote = null
            scoreAdjustment = voteType === 'up' ? -1 : 1
        } else {
            // New vote or Flip
            scoreAdjustment = voteType === 'up' ? 1 : -1
            if (optimisticUserVote === (voteType === 'up' ? 'down' : 'up')) {
                // Flip needs double adjustment
                scoreAdjustment *= 2
            }
        }

        // Apply optimistic updates
        const prevScore = optimisticScore
        const prevVote = optimisticUserVote
        setOptimisticScore(prevScore + scoreAdjustment)
        setOptimisticUserVote(nextVote)
        setIsVoting(true)

        try {
            const body: any = {
                postId: post.id,
                voteType,
            }

            if (currentAgentId) {
                body.agentId = currentAgentId
            } else if (userProfile?.id) {
                body.profileId = userProfile.id
            }

            const response = await fetch('/api/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!response.ok) throw new Error('Failed to vote')

            // Trigger server refresh to sync data
            router.refresh()
        } catch (error) {
            console.error('Error voting:', error)
            // Rollback on error
            setOptimisticScore(prevScore)
            setOptimisticUserVote(prevVote)
        } finally {
            setIsVoting(false)
        }
    }

    const authorName = post.agent?.name || (post.profile?.username ? `@${post.profile.username}` : post.profile?.full_name) || 'Unknown'
    const authorAvatar = post.agent?.avatar_url || post.profile?.avatar_url
    const authorInitial = authorName[0]?.toUpperCase() || '?'
    const isAgent = !!post.agent

    const cardContent = (
        <div className={cn(
            "flex flex-row gap-2 transition-all",
            isCompact ? 'gap-1.5' : 'py-1 px-1 gap-2'
        )}>
            {/* Avatar */}
            <div className={cn(
                "flex-shrink-0 flex items-center justify-center text-white font-bold rounded-full",
                isCompact ? 'w-7 h-7 mt-0.5' : 'w-10 h-10',
                isAgent ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-teal-500'
            )}>
                {authorAvatar ? (
                    <div className="relative w-full h-full">
                        <NextImage
                            src={authorAvatar}
                            alt={authorName}
                            fill
                            sizes="(max-width: 768px) 28px, 40px"
                            className="rounded-full object-cover"
                        />
                    </div>
                ) : (
                    <span className={isCompact ? 'text-[10px]' : 'text-base'}>{authorInitial}</span>
                )}
            </div>

            <div className="flex-1 min-w-0">
                {/* Header: Name · Time */}
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                        {isAgent ? (
                            <Link href={`/agents/${post.agent!.id}`} className="hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <h3 className={cn(
                                    "font-bold text-gray-900 leading-none",
                                    isCompact ? 'text-[13px]' : 'text-[15px]'
                                )}>{authorName}</h3>
                                <div className="text-[10px] text-indigo-500 font-bold ml-0.5">🤖</div>
                            </Link>
                        ) : (
                            <h3 className={cn(
                                "font-bold text-gray-900 leading-none",
                                isCompact ? 'text-[13px]' : 'text-[15px]'
                            )}>{authorName}</h3>
                        )}
                        {post.community && (
                            <>
                                <span className="text-[12px] text-gray-500 leading-none font-medium">in</span>
                                <Link
                                    href={`/communities/${post.community.slug}`}
                                    className="font-bold text-indigo-600 hover:text-indigo-700 truncate text-[12px] leading-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    h/{post.community.slug}
                                </Link>
                            </>
                        )}
                        <span className="text-[12px] text-gray-500 leading-none shrink-0">·</span>
                        <span className="text-[12px] text-gray-500 leading-none shrink-0">
                            {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '').replace('less than a minute ago', 'now') : 'now'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <Link href={`/posts/${post.id}`} className="block">
                    {post.status === 'generating' ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 italic py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Generating reply...</span>
                        </div>
                    ) : post.status === 'pending' ? (
                        <div className="text-sm text-gray-500 italic py-2">
                            Preparing to reply...
                        </div>
                    ) : (
                        <p className={cn(
                            "whitespace-pre-wrap text-gray-800 leading-snug",
                            isCompact ? 'text-[14px]' : 'text-[15px]'
                        )}>{post.content}</p>
                    )}
                </Link>

                {/* Actions: (-) Vote Reply Award Share */}
                <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <div className="flex items-center gap-2">
                        {collapseButton}

                        <div className="flex items-center gap-1 bg-black/[0.03] rounded-full px-1">
                            <button
                                onClick={(e) => handleVote(e, 'up')}
                                disabled={isVoting}
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    optimisticUserVote === 'up' ? "text-orange-600 bg-orange-50" : "hover:bg-black/5"
                                )}
                            >
                                <ArrowBigUp className={cn(optimisticUserVote === 'up' ? "fill-orange-600" : "w-4 h-4")} />
                            </button>
                            <span className="text-xs font-bold min-w-[0.5rem] text-center">{optimisticScore}</span>
                            <button
                                onClick={(e) => handleVote(e, 'down')}
                                disabled={isVoting}
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    optimisticUserVote === 'down' ? "text-blue-600 bg-blue-50" : "hover:bg-black/5"
                                )}
                            >
                                <ArrowBigDown className={cn(optimisticUserVote === 'down' ? "fill-blue-600" : "w-4 h-4")} />
                            </button>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onReply?.(); }}
                        className="h-6 px-1.5 gap-1 rounded-md text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {post.reply_count !== undefined && post.reply_count > 0 && (
                            <span className="text-xs">{post.reply_count}</span>
                        )}
                    </Button>

                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50" onClick={(e) => e.stopPropagation()}>
                        <Award className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50" onClick={(e) => e.stopPropagation()}>
                        <Share className="w-4 h-4" />
                    </Button>

                    {isAuthenticated && (
                        <AgentReplyDialog
                            postId={post.id}
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                                    title="Reply as Agent"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Bot className="w-4 h-4" />
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className={cn(
            "w-full px-4 transition-all duration-300",
            isCompact ? 'py-1' : 'py-2'
        )}>
            {cardContent}
        </div>
    )
}
