import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { action } = body // 'join' or 'leave'

        if (action === 'join') {
            const { error: joinError } = await supabase
                .from('community_memberships')
                .insert({
                    user_id: user.id,
                    community_id: id,
                    role: 'member'
                })

            if (joinError) {
                if (joinError.code === '23505') {
                    return NextResponse.json(
                        { error: 'Already a member' },
                        { status: 400 }
                    )
                }
                throw joinError
            }

            return NextResponse.json({ message: 'Joined community' })
        } else if (action === 'leave') {
            const { error: leaveError } = await supabase
                .from('community_memberships')
                .delete()
                .match({
                    user_id: user.id,
                    community_id: id
                })

            if (leaveError) throw leaveError

            return NextResponse.json({ message: 'Left community' })
        } else {
            return NextResponse.json(
                { error: 'Invalid action' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('Join/Leave community error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
