'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { Users, Plus, Check, Settings, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface CommunityHeaderProps {
    community: {
        id: string
        name: string
        slug: string
        description: string | null
        avatar_url: string | null
        banner_url: string | null
        members: { count: number }[] | any
        created_by: string | null
    }
    isJoined: boolean
    currentUserId?: string
}

export function CommunityHeader({ community, isJoined: initialIsJoined, currentUserId }: CommunityHeaderProps) {
    useEffect(() => {
        // Track recent community view
        const stored = localStorage.getItem('recent_communities')
        let recent = []
        if (stored) {
            try {
                recent = JSON.parse(stored)
            } catch (e) {
                console.error('Failed to parse recent communities', e)
            }
        }

        // Filter out existing and add to top
        const filtered = recent.filter((c: any) => c.id !== community.id)
        const updated = [
            { id: community.id, slug: community.slug, name: community.name },
            ...filtered
        ].slice(0, 10)

        localStorage.setItem('recent_communities', JSON.stringify(updated))
    }, [community])

    const [isJoined, setIsJoined] = useState(initialIsJoined)
    const [isLoading, setIsLoading] = useState(false)
    const [memberCount, setMemberCount] = useState((Array.isArray(community.members) ? community.members[0]?.count : community.members?.count) || 0)

    const handleJoinLeave = async () => {
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

            setMemberCount((prev: number) => isJoined ? prev - 1 : prev + 1)
            setIsJoined(!isJoined)
            toast.success(isJoined ? `Left h/${community.slug}` : `Joined h/${community.slug}`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const isCreator = currentUserId === community.created_by

    return (
        <div className="relative mb-8">
            {/* Banner */}
            <div className="h-48 md:h-64 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative rounded-b-3xl overflow-hidden shadow-lg">
                {community.banner_url && (
                    <NextImage
                        src={community.banner_url}
                        alt={community.name}
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* Content Container */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16 md:-mt-20 flex flex-col md:flex-row md:items-end gap-6 pb-6 border-b border-gray-100">
                    {/* Avatar */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-white p-1.5 shadow-xl animate-scale-in">
                        <div className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden border-4 border-white">
                            {community.avatar_url ? (
                                <NextImage
                                    src={community.avatar_url}
                                    alt={community.name}
                                    width={160}
                                    height={160}
                                    className="object-cover"
                                />
                            ) : (
                                <span className="text-5xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                    {community.name[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 md:mb-2">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                                {community.name}
                            </h1>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold border border-indigo-100">
                                h/{community.slug}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 mb-4">
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                <Users className="w-4 h-4 text-indigo-500" />
                                <span className="text-gray-900">{memberCount}</span> members
                            </div>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                <Info className="w-4 h-4 text-purple-500" />
                                Created <span className="text-gray-900">2026</span>
                            </div>
                        </div>

                        {community.description && (
                            <p className="text-gray-600 max-w-2xl leading-relaxed">
                                {community.description}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 md:mb-2 ml-auto">
                        <Button
                            size="lg"
                            variant={isJoined ? "outline" : "default"}
                            className={cn(
                                "h-12 px-8 rounded-2xl font-bold shadow-md transition-all duration-300",
                                !isJoined && "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                            )}
                            onClick={handleJoinLeave}
                            disabled={isLoading}
                        >
                            {isJoined ? (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Joined
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 mr-2" />
                                    Join Community
                                </>
                            )}
                        </Button>

                        {isCreator && (
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-gray-200">
                                <Settings className="w-5 h-5 text-gray-500" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
