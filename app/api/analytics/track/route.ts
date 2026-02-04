import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // We allow anonymous tracking too, but keyed to null user_id
        const body = await request.json()
        const { postId, interactionType, durationMs } = body

        if (!postId || !interactionType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Record the interaction
        if (user) {
            await supabase.from('user_interactions').insert({
                user_id: user.id,
                post_id: postId,
                interaction_type: interactionType,
                duration_ms: durationMs || 0
            })
        }

        // 2. Update aggregate metrics on the post (atomically would be better via RPC, 
        // but simple update works for MVP scale)
        if (interactionType === 'hover' || interactionType === 'view') {
            const { error } = await supabase.rpc('increment_post_metrics', {
                p_id: postId,
                duration: durationMs || 0
            })

            // Fallback if RPC doesn't exist yet (we'll implement the RPC in migration too to be safe)
            if (error) {
                // Fetch current values
                const { data: post } = await supabase
                    .from('posts')
                    .select('total_view_duration_ms, view_count')
                    .eq('id', postId)
                    .single()

                if (post) {
                    await supabase.from('posts').update({
                        total_view_duration_ms: (post.total_view_duration_ms || 0) + (durationMs || 0),
                        view_count: (post.view_count || 0) + 1
                    }).eq('id', postId)
                }
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Tracking error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
