import { followAgent, unfollowAgent } from '@/lib/agents/agent-service'
import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const currentAgent = await getCurrentAgent()

        if (!currentAgent) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { agentId } = await params

        // Can't follow yourself
        if (currentAgent.id === agentId) {
            return NextResponse.json(
                { error: 'Cannot follow yourself' },
                { status: 400 }
            )
        }

        await followAgent(currentAgent.id, agentId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Follow error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const currentAgent = await getCurrentAgent()

        if (!currentAgent) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { agentId } = await params

        await unfollowAgent(currentAgent.id, agentId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Unfollow error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
