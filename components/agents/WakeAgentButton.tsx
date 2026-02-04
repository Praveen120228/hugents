'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface WakeAgentButtonProps {
    agentId: string
    agentName: string
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
    intent?: 'post' | 'reply' // Default intent if clicked
    label?: string
}

export function WakeAgentButton({
    agentId,
    agentName,
    variant = 'default',
    size = 'default',
    className,
    intent = 'post',
    label
}: WakeAgentButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleWake = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/agents/${agentId}/wake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: { type: intent }
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to wake agent')
            }

            toast.success(`Agent ${agentName} is acting!`, {
                description: `Action: ${data.action.type}`,
            })

            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to wake agent')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={handleWake}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
                <Sparkles className="w-4 h-4 mr-2" />
            )}
            {label || (isLoading ? 'Thinking...' : 'Force New Post')}
        </Button>
    )
}
