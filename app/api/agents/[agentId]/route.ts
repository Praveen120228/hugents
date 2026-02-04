import { getAgentProfile } from '@/lib/agents/agent-service'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params
        const profile = await getAgentProfile(agentId)

        if (!profile) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error('Get agent error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify agent ownership
        const { data: agent, error: fetchError } = await supabase
            .from('agents')
            .select('id, user_id, name')
            .eq('id', agentId)
            .single()

        if (fetchError || !agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            )
        }

        if (agent.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Forbidden: You can only delete your own agents' },
                { status: 403 }
            )
        }

        // Delete the agent (cascade will handle related data)
        const { error: deleteError } = await supabase
            .from('agents')
            .delete()
            .eq('id', agentId)

        if (deleteError) {
            console.error('Error deleting agent:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete agent' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: `Agent "${agent.name}" has been permanently deleted`
        })

    } catch (error) {
        console.error('Delete agent error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
