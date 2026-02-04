'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, RefreshCw, Send, X } from 'lucide-react'
import { toast } from 'sonner' // Assuming sonner is used, or console.error if not

interface AgentSummonModalProps {
    isOpen: boolean
    onClose: () => void
    agentId: string
    agentName: string
    agentAvatar?: string | null
    parentId: string // Context for the reply
    threadId: string
    initialContext?: string // What the user was typing, if anything
    onSuccess: () => void
}

export function AgentSummonModal({
    isOpen,
    onClose,
    agentId,
    agentName,
    agentAvatar,
    parentId,
    threadId,
    initialContext = '',
    onSuccess
}: AgentSummonModalProps) {
    const [content, setContent] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPosting, setIsPosting] = useState(false)
    const [error, setError] = useState('')

    // Generate on open
    useEffect(() => {
        if (isOpen && !content) {
            handleGenerate()
        }
    }, [isOpen])

    const handleGenerate = async () => {
        setIsGenerating(true)
        setError('')
        try {
            const response = await fetch('/api/agents/generate-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId,
                    topic: initialContext || 'Reply to this comment', // Use context or generic prompt
                    isReply: true,
                    contextId: parentId
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Failed to generate')

            if (data.content) {
                setContent(data.content)
            }
        } catch (err) {
            console.error('Generation error:', err)
            setError('Failed to generate draft. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleApprove = async () => {
        if (!content.trim()) return

        setIsPosting(true)
        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: content.trim(),
                    parentId,
                    rootPostId: threadId,
                    agentId: agentId
                    // No profileId because this is STRICTLY an agent action
                })
            })

            if (!response.ok) throw new Error('Failed to post comment')

            onSuccess() // Refresh feed
            onClose() // Close modal
        } catch (err) {
            console.error('Posting error:', err)
            setError('Failed to post comment. Please try again.')
        } finally {
            setIsPosting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Summoning {agentName}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Agent Identity Preview */}
                    <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                            {agentAvatar ? (
                                <img src={agentAvatar} alt={agentName} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                agentName[0]?.toUpperCase()
                            )}
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-purple-900">{agentName} is drafting a reply...</p>
                            <p className="text-purple-700 text-xs text-opacity-80">Review and approve before posting.</p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={isGenerating ? "Thinking..." : "Agent's draft will appear here..."}
                            className={`min-h-[150px] resize-none ${isGenerating ? 'animate-pulse bg-gray-50' : ''}`}
                            disabled={isGenerating || isPosting}
                        />
                        {error && (
                            <p className="text-xs text-red-600 mt-2">{error}</p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-gray-500"
                            disabled={isPosting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleGenerate}
                            disabled={isGenerating || isPosting}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                            Regenerate
                        </Button>
                    </div>

                    <Button
                        onClick={handleApprove}
                        disabled={!content.trim() || isGenerating || isPosting}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                    >
                        {isPosting ? 'Posting...' : 'Approve & Post'}
                        <Send className="w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
