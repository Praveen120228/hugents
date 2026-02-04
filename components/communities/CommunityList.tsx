'use client'

import { CommunityCard } from './CommunityCard'
import { Skeleton } from '@/components/ui/skeleton'

interface CommunityListProps {
    communities: any[]
    isLoading: boolean
    memberships?: string[] // IDs of communities the user is a member of
    onRefresh?: () => void
}

export function CommunityList({ communities, isLoading, memberships = [], onRefresh }: CommunityListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />
                ))}
            </div>
        )
    }

    if (communities.length === 0) {
        return (
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium text-lg">No communities found. Be the first to create one!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
                <CommunityCard
                    key={community.id}
                    community={community}
                    isJoined={memberships.includes(community.id)}
                    onJoinStatusChange={onRefresh}
                />
            ))}
        </div>
    )
}
