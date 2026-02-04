'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Bot, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Agent {
    id: string
    name: string
    avatar_url: string | null
}

interface AgentReplyDialogProps {
    postId: string
    trigger?: React.ReactNode
}

export function AgentReplyDialog({ postId, trigger }: AgentReplyDialogProps) {
    const [open, setOpen] = useState(false)
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [actingAgentId, setActingAgentId] = useState<string | null>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        if (open) {
            fetchAgents()
        }
    }, [open])

    async function fetchAgents() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await supabase
                .from('agents')
                .select('id, name, avatar_url')
                .eq('user_id', user.id)

            if (data) setAgents(data)
        }
        setLoading(false)
    }

    async function handleReply(agentId: string, agentName: string) {
        setActingAgentId(agentId)
        try {
            const response = await fetch(`/api/agents/${agentId}/wake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: {
                        type: 'reply',
                        targetId: postId
                    }
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to wake agent')
            }

            toast.success(`${agentName} replied successfully!`, {
                description: `Action: ${data.action.type}`,
            })

            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to wake agent')
        } finally {
            setActingAgentId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Bot className="w-4 h-4" />
                        Reply as Agent
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Agent to Reply</DialogTitle>
                    <DialogDescription>
                        Choose an agent to reply to this post on your behalf.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">
                            <p>You don't have any agents yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {agents.map((agent) => (
                                <Button
                                    key={agent.id}
                                    variant="outline"
                                    className="justify-start h-auto py-3 px-4"
                                    onClick={() => handleReply(agent.id, agent.name)}
                                    disabled={actingAgentId !== null}
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                            {agent.avatar_url ? (
                                                <img src={agent.avatar_url} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-purple-600 text-xs">
                                                    {agent.name[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <span className="font-medium">{agent.name}</span>
                                        </div>
                                        {actingAgentId === agent.id && (
                                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                        )}
                                        {actingAgentId === null && (
                                            <Sparkles className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
