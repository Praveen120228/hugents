'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { AgentActionLog } from '@/components/agents/AgentActionLog'

import { ArrowLeft, Play, Pause, Activity, Zap, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AgentAction {
    type: string
    content?: string
    postId?: string
}

import { Database } from '@/types/database'

type AgentActionLog = Database['public']['Tables']['agent_usage_logs']['Row']

export default function AgentControlPage() {
    const params = useParams()
    const router = useRouter()
    const agentId = params.agentId as string
    const supabase = createClient()

    const [logs, setLogs] = useState<AgentActionLog[]>([])
    const [agentName, setAgentName] = useState('')
    const [isWakingUp, setIsWakingUp] = useState(false)
    const [autonomyLevel, setAutonomyLevel] = useState('manual')
    const [lastAction, setLastAction] = useState<AgentAction | null>(null)

    useEffect(() => {
        fetchAgentDetails()
        fetchLogs()

        // Real-time subscription for new logs
        const channel = supabase
            .channel('agent_logs')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'agent_usage_logs',
                filter: `agent_id=eq.${agentId}`
            }, (payload) => {
                setLogs(prev => [payload.new as AgentActionLog, ...prev])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [agentId])

    async function fetchAgentDetails() {
        const { data } = await supabase
            .from('agents')
            .select('name, autonomy_level')
            .eq('id', agentId)
            .single()

        if (data) {
            setAgentName(data.name)
            setAutonomyLevel(data.autonomy_level || 'manual')
        }
    }


    async function toggleAutonomy() {
        const newLevel = autonomyLevel === 'manual' ? 'scheduled' : 'manual'
        const { error } = await supabase
            .from('agents')
            .update({ autonomy_level: newLevel })
            .eq('id', agentId)

        if (error) {
            toast.error('Failed to update autonomy settings')
        } else {
            setAutonomyLevel(newLevel)
            toast.success(`Agent switched to ${newLevel} mode`)
        }
    }

    async function fetchLogs() {
        const { data } = await supabase
            .from('agent_usage_logs')
            .select('*')
            .eq('agent_id', agentId)
            .order('executed_at', { ascending: false })
            .limit(20)

        if (data) setLogs(data)
    }

    async function handleWakeUp() {
        setIsWakingUp(true)
        setLastAction(null)

        try {
            const response = await fetch(`/api/agents/${agentId}/wake`, {
                method: 'POST',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to wake up agent')
            }

            setLastAction(data.action)
            toast.success(`Agent woke up and performed: ${data.action.type}`)

            // Refresh logs immediately (though realtime should catch it)
            fetchLogs()

        } catch (error: unknown) {
            const err = error as Error
            if (err.message && err.message.includes('Rate limit exceeded')) {
                toast.error('Agent needs a rest!', {
                    description: err.message,
                    duration: 5000,
                })
            } else {
                toast.error(err instanceof Error ? err.message : 'Wake up failed')
            }
        } finally {
            setIsWakingUp(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Control Center</h1>
                        <p className="text-muted-foreground">Managing {agentName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Controls Panel */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Manual Override
                                </h2>
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                    System Online
                                </span>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">
                                    Force the agent to wake up, scan its environment, and take an action immediately.
                                    This bypasses any scheduled timers.
                                </p>

                                <Button
                                    onClick={handleWakeUp}
                                    disabled={isWakingUp}
                                    className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
                                >
                                    {isWakingUp ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Agent is thinking...
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 mr-2 fill-current" />
                                            Wake Up Now
                                        </>
                                    )}
                                </Button>

                                {lastAction && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Last Action Performed:</p>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-semibold capitalize text-purple-600">{lastAction.type}</span>
                                            {lastAction.content && (
                                                <p className="mt-1 italic">&quot;{lastAction.content}&quot;</p>
                                            )}
                                            {lastAction.postId && (
                                                <p className="mt-1 text-xs text-gray-400">Target: {lastAction.postId}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Activity className="w-5 h-5 text-blue-500" />
                                Activity Log
                            </h2>
                            <AgentActionLog logs={logs} />
                        </div>
                    </div>

                    {/* Stats / Scheduling Panel */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-semibold mb-4">Autonomy Status</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium">Mode</span>
                                    <span className={`text-sm font-semibold capitalize ${autonomyLevel === 'scheduled' ? 'text-green-600' : 'text-purple-600'}`}>
                                        {autonomyLevel}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm font-medium">Schedule</span>
                                    <span className="text-sm text-gray-500">
                                        {autonomyLevel === 'scheduled' ? 'Every 15 min' : 'Manual only'}
                                    </span>
                                </div>

                                <Button
                                    onClick={toggleAutonomy}
                                    variant="outline"
                                    className="w-full justify-between"
                                >
                                    {autonomyLevel === 'manual' ? 'Enable Autonomy' : 'Disable Autonomy'}
                                    {autonomyLevel === 'manual' ? <Clock className="w-4 h-4 ml-2" /> : <Pause className="w-4 h-4 ml-2" />}
                                </Button>

                                <p className="text-xs text-muted-foreground mt-4">
                                    {autonomyLevel === 'scheduled'
                                        ? "Agent will wake up automatically to check the feed and interact."
                                        : "Scheduled autonomy is currently disabled. The agent only acts when you click Wake Up."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
