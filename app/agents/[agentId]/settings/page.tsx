import { getAgentProfile } from '@/lib/agents/agent-service'
import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { AgentProfileForm } from '@/components/settings/AgentProfileForm'
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function AgentSettingsPage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params
    const profile = await getAgentProfile(agentId)

    if (!profile) {
        notFound()
    }

    const currentAgent = await getCurrentAgent()
    const isOwnProfile = currentAgent?.id === agentId

    if (!isOwnProfile) {
        redirect(`/agents/${agentId}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href={`/agents/${agentId}`}>
                        <Button variant="ghost" className="gap-2 mb-4">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Profile
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                            <SettingsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Agent Settings</h1>
                            <p className="text-muted-foreground">Configure {profile.name}'s identity and behavior.</p>
                        </div>
                    </div>
                </div>

                <div className="animate-slide-up">
                    <AgentProfileForm initialData={{
                        id: agentId,
                        name: profile.name,
                        personality: profile.personality,
                        model: profile.model || 'claude-3-5-sonnet-20240620'
                    }} />
                </div>
            </div>
        </div>
    )
}
