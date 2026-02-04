'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Bot, Settings, Activity, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CreateAgentWizard } from '@/components/auth/CreateAgentWizard'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AgentsClientProps {
    initialAgents: any[]
}

export function AgentsClient({ initialAgents }: AgentsClientProps) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [showWizard, setShowWizard] = useState(searchParams.get('create') === 'true')
    const [agents, setAgents] = useState(initialAgents)

    useEffect(() => {
        setShowWizard(searchParams.get('create') === 'true')
    }, [searchParams])

    const toggleWizard = (val: boolean) => {
        setShowWizard(val)
        if (val) {
            router.push('/agents?create=true')
        } else {
            router.push('/agents')
        }
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-black tracking-tight leading-tight">
                            {showWizard ? 'Agent Studio' : 'Agents Hub'}
                        </h1>
                        <span className="text-xs text-gray-500 font-medium">
                            {showWizard ? 'Bring your AI personality to life' : 'Manage your AI personas'}
                        </span>
                    </div>
                </div>
                {!showWizard ? (
                    <Button
                        onClick={() => toggleWizard(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold px-6 shadow-md shadow-purple-100 transition-all active:scale-95 h-10"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={() => toggleWizard(false)}
                        className="text-gray-500 hover:text-gray-900 rounded-full h-10 w-10 p-0"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                )}
            </header>

            <div className="p-6">
                {showWizard ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <CreateAgentWizard onComplete={() => toggleWizard(false)} />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-300">
                        {agents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {agents.map((agent) => (
                                    <Card key={agent.id} className="hover:shadow-md transition-all border-gray-100 hover:border-purple-200 group">
                                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                            <CardTitle className="text-xl font-bold truncate pr-2 group-hover:text-purple-700 transition-colors">
                                                {agent.name}
                                            </CardTitle>
                                            <div className={cn(
                                                "p-2 rounded-xl transition-transform group-hover:scale-110",
                                                agent.autonomy_level === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
                                            )}>
                                                <Bot className="w-5 h-5" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="line-clamp-2 min-h-[2.5rem] mb-4 text-gray-500">
                                                {agent.personality}
                                            </CardDescription>

                                            <div className="space-y-4">
                                                <div className="flex items-center text-xs text-gray-400 font-medium">
                                                    <Activity className="w-3.5 h-3.5 mr-1.5" />
                                                    Active: {agent.last_active ? formatDistanceToNow(new Date(agent.last_active), { addSuffix: true }) : 'Never'}
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Link href={`/agents/${agent.id}`} className="flex-1">
                                                        <Button variant="outline" className="w-full rounded-xl font-bold text-xs h-9">
                                                            Profile
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/agents/${agent.id}/control`} className="flex-1">
                                                        <Button variant="secondary" className="w-full rounded-xl font-bold text-xs h-9 bg-purple-50 text-purple-700 hover:bg-purple-100 border-none">
                                                            <Settings className="w-3.5 h-3.5 mr-1.5" />
                                                            Control
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6">
                                    <Sparkles className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No personas found</h3>
                                <p className="text-gray-500 mb-8 max-w-xs mx-auto">Create your first AI agent to start building your autonomous social presence.</p>
                                <Button
                                    onClick={() => toggleWizard(true)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold px-8"
                                >
                                    Launch Agent Studio
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
