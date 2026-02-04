'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import NextImage from 'next/image'
import { Users, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommunityCardProps {
    community: {
        id: string
        name: string
        slug: string
        description: string | null
        avatar_url: string | null
        banner_url: string | null
        members: { count: number }[] | any // Supabase count return structure
    }
    isJoined?: boolean
    onJoinStatusChange?: () => void
}

export function CommunityCard({ community, isJoined = false, onJoinStatusChange }: CommunityCardProps) {
    const [isLoading, setIsLoading] = useState(false)

    // Supabase count query returns [{count: n}] or just n depending on how it's called
    const memberCount = (Array.isArray(community.members) ? community.members[0]?.count : community.members?.count) || 0

    const handleJoinLeave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        setIsLoading(true)
        try {
            const response = await fetch(`/api/communities/${community.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: isJoined ? 'leave' : 'join' }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update membership')
            }

            toast.success(isJoined ? `Left ${community.name}` : `Joined ${community.name}`)
            onJoinStatusChange?.()
        } catch (error: any) {
            console.error('Join/Leave error:', error)
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const initial = community.name[0]?.toUpperCase() || '?'

    return (
        <Link href={`/communities/${community.slug}`}>
            <Card className="group overflow-hidden border-none bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 shadow-sm hover:shadow-md h-full flex flex-col">
                {/* Banner */}
                <div className="h-20 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                    {community.banner_url && (
                        <NextImage
                            src={community.banner_url}
                            alt={community.name}
                            fill
                            className="object-cover opacity-80"
                        />
                    )}
                </div>

                {/* Content */}
                <div className="px-5 pb-5 pt-0 flex-1 flex flex-col">
                    <div className="relative -mt-8 mb-3">
                        <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-sm transition-transform group-hover:scale-105 duration-300">
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden">
                                {community.avatar_url ? (
                                    <NextImage
                                        src={community.avatar_url}
                                        alt={community.name}
                                        width={64}
                                        height={64}
                                        className="object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        {initial}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            h/{community.slug}
                        </h3>
                        <p className="text-sm font-medium text-gray-700 mb-2">{community.name}</p>
                        {community.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                {community.description}
                            </p>
                        )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>{memberCount} members</span>
                        </div>

                        <Button
                            size="sm"
                            variant={isJoined ? "outline" : "default"}
                            className={cn(
                                "h-8 px-4 rounded-full transition-all duration-300",
                                !isJoined && "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200"
                            )}
                            onClick={handleJoinLeave}
                            disabled={isLoading}
                        >
                            {isJoined ? (
                                <>
                                    <Check className="w-3.5 h-3.5 mr-1.5" />
                                    Joined
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                                    Join
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
