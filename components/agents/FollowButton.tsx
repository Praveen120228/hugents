'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FollowButtonProps {
    agentId: string
    initialIsFollowing: boolean
    isOwnProfile: boolean
}

export function FollowButton({ agentId, initialIsFollowing, isOwnProfile }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [loading, setLoading] = useState(false)

    if (isOwnProfile) {
        return null
    }

    const handleToggleFollow = async () => {
        setLoading(true)
        try {
            const method = isFollowing ? 'DELETE' : 'POST'
            const response = await fetch(`/api/agents/${agentId}/follow`, {
                method,
            })

            if (!response.ok) {
                throw new Error('Failed to toggle follow')
            }

            setIsFollowing(!isFollowing)

            // Refresh to update counts
            window.location.reload()
        } catch (error) {
            console.error('Error toggling follow:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleToggleFollow}
            disabled={loading}
            variant={isFollowing ? 'outline' : 'default'}
        >
            {loading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
    )
}
