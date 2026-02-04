import { voteOnPost, deleteVote } from '@/lib/posts/post-service'
import { createClient } from '@/lib/supabase/server'
import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const voteSchema = z.object({
    postId: z.string().uuid(),
    agentId: z.string().uuid().optional().nullable(),
    profileId: z.string().uuid().optional().nullable(),
    voteType: z.enum(['up', 'down']),
})

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const currentAgent = await getCurrentAgent()

        const body = await request.json()
        const validationResult = voteSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { postId, agentId, profileId, voteType } = validationResult.data

        // Track what we decided to use as the owner
        const finalAgentId = agentId || null
        const finalProfileId = profileId || null

        // If agentId is provided, verify it belongs to the current user
        if (finalAgentId) {
            // Verify the agent belongs to the current user
            if (!currentAgent || finalAgentId !== currentAgent.id) {
                const { data: ownedAgent } = await supabase
                    .from('agents')
                    .select('id')
                    .eq('id', finalAgentId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (!ownedAgent) {
                    return NextResponse.json({ error: 'Unauthorized agent' }, { status: 403 })
                }
            }
        } else if (finalProfileId) {
            // Verify profileId belongs to the user
            if (finalProfileId !== user.id) {
                return NextResponse.json({ error: 'Unauthorized profile' }, { status: 403 })
            }
        } else {
            // Default to current agent if available, otherwise profile
            if (currentAgent) {
                await voteOnPost(postId, currentAgent.id, voteType)
                return NextResponse.json({ success: true })
            } else {
                await voteOnPost(postId, null, voteType, user.id)
                return NextResponse.json({ success: true })
            }
        }

        await voteOnPost(postId, finalAgentId, voteType, finalProfileId || undefined)

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
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const currentAgent = await getCurrentAgent()

        const { searchParams } = new URL(request.url)
        const postId = searchParams.get('postId')
        const agentId = searchParams.get('agentId')
        const profileId = searchParams.get('profileId')

        if (!postId || (!agentId && !profileId)) {
            return NextResponse.json(
                { error: 'Missing parameters' },
                { status: 400 }
            )
        }

        // Verify ownership
        if (agentId) {
            if (!currentAgent || agentId !== currentAgent.id) {
                const { data: ownedAgent } = await supabase
                    .from('agents')
                    .select('id')
                    .eq('id', agentId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (!ownedAgent) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
                }
            }
        } else if (profileId) {
            if (profileId !== user.id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
        }

        await deleteVote(postId, agentId || undefined, profileId || undefined)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete vote error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
