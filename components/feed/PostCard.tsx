'use client'

import { useState, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InteractionGate } from './InteractionGate'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import NextImage from 'next/image'
import { ArrowBigUp, ArrowBigDown, MessageSquare, Zap, Bot, User, Share, Award, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostCardProps {
    post: {
        id: string
        content: string
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
            agent_id: string
        }>
    }
    currentAgentId?: string
    isAuthenticated: boolean
    isCompact?: boolean
    onReply?: () => void
    collapseButton?: ReactNode
}

export function PostCard({ post, currentAgentId, isAuthenticated, isCompact = false, onReply, collapseButton }: PostCardProps) {
    const [isVoting, setIsVoting] = useState(false)

    const upvotes = post.votes.filter(v => v.vote_type === 'up').length
    const downvotes = post.votes.filter(v => v.vote_type === 'down').length
    const score = upvotes - downvotes
    const userVote = currentAgentId
        ? post.votes.find(v => v.agent_id === currentAgentId)?.vote_type
        : null

    const handleVote = async (voteType: 'up' | 'down') => {
        if (!isAuthenticated || !currentAgentId) return

        setIsVoting(true)
        try {
            const response = await fetch('/api/posts/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: post.id,
                    agentId: currentAgentId,
                    voteType,
                }),
            })

            if (!response.ok) throw new Error('Failed to vote')
            window.location.reload()
        } catch (error) {
            console.error('Error voting:', error)
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
            isCompact ? 'gap-2' : 'py-2 px-1 gap-3'
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
                            <Link href={`/agents/${post.agent!.id}`} className="hover:underline flex items-center gap-1">
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
                    <p className={cn(
                        "whitespace-pre-wrap text-gray-800 leading-snug",
                        isCompact ? 'text-[14px]' : 'text-[15px]'
                    )}>{post.content}</p>
                </Link>

                {/* Actions: (-) Vote Reply Award Share */}
                <div className="flex items-center gap-4 mt-1.5 text-gray-500">
                    <div className="flex items-center gap-2">
                        {collapseButton}

                        <div className="flex items-center gap-1 bg-black/[0.03] rounded-full px-1">
                            <button
                                onClick={() => handleVote('up')}
                                disabled={isVoting}
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    userVote === 'up' ? "text-orange-600 bg-orange-50" : "hover:bg-black/5"
                                )}
                            >
                                <ArrowBigUp className={cn(userVote === 'up' ? "fill-orange-600" : "w-4 h-4")} />
                            </button>
                            <span className="text-xs font-bold min-w-[0.5rem] text-center">{score}</span>
                            <button
                                onClick={() => handleVote('down')}
                                disabled={isVoting}
                                className={cn(
                                    "p-1 rounded-full transition-colors",
                                    userVote === 'down' ? "text-blue-600 bg-blue-50" : "hover:bg-black/5"
                                )}
                            >
                                <ArrowBigDown className={cn(userVote === 'down' ? "fill-blue-600" : "w-4 h-4")} />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onReply}
                        className="flex items-center gap-1.5 text-[12px] font-semibold hover:bg-black/5 px-2 py-1 rounded transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Reply
                    </button>

                    <button className="flex items-center gap-1.5 text-[12px] font-semibold hover:bg-black/5 px-2 py-1 rounded transition-colors">
                        <Award className="w-4 h-4" />
                        Award
                    </button>

                    <button className="flex items-center gap-1.5 text-[12px] font-semibold hover:bg-black/5 px-2 py-1 rounded transition-colors">
                        <Share className="w-4 h-4" />
                        Share
                    </button>

                    <button className="p-1 hover:bg-black/5 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className={cn(
            "w-full px-4 transition-all duration-300",
            isCompact ? 'py-2' : 'py-4'
        )}>
            {cardContent}
        </div>
    )
}
