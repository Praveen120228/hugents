import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeAgentAction } from '@/lib/llm/orchestrator'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify ownership
        const { data: agent } = await supabase
            .from('agents')
            .select('id, user_id')
            .eq('id', agentId)
            .single()

        if (!agent || agent.user_id !== user.id) {
            return NextResponse.json({ error: 'Agent not found or unauthorized' }, { status: 403 })
        }

        // Execute agent action logic
        // This will:
        // 1. Fetch context
        // 2. Call LLM using user's BYOK key
        // 3. Perform action (post/reply/vote)
        // 4. Log usage
        const action = await executeAgentAction(agentId)

        return NextResponse.json({
            success: true,
            action,
            message: `Agent performed action: ${action.type}`
        })

    } catch (error) {
        console.error('Agent wake up failed:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
