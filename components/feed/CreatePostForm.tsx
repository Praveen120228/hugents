'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'

interface CreatePostFormProps {
    agentId?: string | null
    agentName?: string | null
    agentAvatar?: string | null
    userProfile?: {
        id: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
    } | null
    // New props for replies
    isReply?: boolean
    parentId?: string
    threadId?: string
    onSuccess?: () => void
    communityId?: string
}

export function CreatePostForm({
    userProfile,
    isReply = false,
    parentId,
    threadId,
    onSuccess,
    communityId,
}: CreatePostFormProps) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const canSubmit = content.trim() && !!userProfile

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim() || !userProfile) return

        setLoading(true)
        try {
            const body = {
                content: content.trim(),
                parentId,
                rootPostId: threadId,
                profileId: userProfile.id,
                communityId
            }

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (!response.ok) throw new Error('Failed to create post')

            setContent('')

            if (onSuccess) {
                onSuccess()
            } else {
                router.refresh()
            }

        } catch (error) {
            console.error('Error creating post:', error)
        } finally {
            setLoading(false)
        }
    }

    const currentName = userProfile?.username ? `@${userProfile.username}` : (userProfile?.full_name || 'Me')
    const currentAvatar = userProfile?.avatar_url

    if (isReply) {
        return (
            <div className="bg-white py-2">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <Textarea
                        autoFocus
                        placeholder="Post your reply"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[80px] p-0 text-[16px] border-none focus-visible:ring-0 resize-none placeholder:text-gray-400"
                    />
                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                        <div className="flex gap-2">
                            {/* Icon buttons could go here (image, etc) */}
                        </div>
                        <div className="flex gap-2">
                            {onSuccess && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-full font-bold text-gray-500"
                                    onClick={onSuccess}
                                >
                                    Cancel
                                </Button>
                            )}
                            <Button
                                type="submit"
                                size="sm"
                                className="rounded-full px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 shadow-sm shadow-purple-100"
                                disabled={!canSubmit || loading}
                            >
                                {loading ? 'Replying...' : 'Reply'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        )
    }

    return (
        <div className="bg-white">
            <form onSubmit={handleSubmit}>
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 shadow-sm">
                        {currentAvatar ? (
                            <NextImage
                                src={currentAvatar}
                                alt={currentName || ''}
                                fill
                                sizes="48px"
                                className="object-cover"
                            />
                        ) : (
                            (currentName || '?')[0].toUpperCase()
                        )}
                    </div>
                    <div className="flex-1">
                        <Textarea
                            placeholder="What's happening?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] border-none focus-visible:ring-0 p-0 text-xl font-medium resize-none placeholder:text-gray-500"
                        />
                        <div className="flex justify-end items-center mt-1">
                            {/* Media upload buttons could go here */}
                            <Button
                                type="submit"
                                disabled={!canSubmit || loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 font-bold h-9 shadow-md shadow-purple-100 transition-all active:scale-95"
                            >
                                {loading ? 'Posting...' : 'Post'}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
