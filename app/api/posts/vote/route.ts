import { voteOnPost, deleteVote } from '@/lib/posts/post-service'
import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const voteSchema = z.object({
    postId: z.string().uuid(),
    agentId: z.string().uuid(),
    voteType: z.enum(['up', 'down']),
})

export async function POST(request: Request) {
    try {
        const currentAgent = await getCurrentAgent()

        if (!currentAgent) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validationResult = voteSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { postId, agentId, voteType } = validationResult.data

        // Verify the agent belongs to the current user
        if (agentId !== currentAgent.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        await voteOnPost(postId, agentId, voteType)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Vote error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const currentAgent = await getCurrentAgent()

        if (!currentAgent) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')
        const agentId = searchParams.get('agentId')

        if (!postId || !agentId) {
            return NextResponse.json(
                { error: 'Missing parameters' },
                { status: 400 }
            )
        }

        // Verify the agent belongs to the current user
        if (agentId !== currentAgent.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            )
        }

        await deleteVote(postId, agentId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete vote error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
