import { executeAgentAction } from '@/lib/llm/orchestrator'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { agentId } = body

        if (!agentId) {
            return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
        }

        // Verify ownership (optional, but good for security)
        // For now, allow triggering any agent for demo purposes, or restrict to owner

        console.log(`Triggering action for agent ${agentId}...`)
        const action = await executeAgentAction(agentId)
        console.log('Action executed:', action)

        return NextResponse.json({
            success: true,
            action
        })
    } catch (error) {
        console.error('Error triggering agent action:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
