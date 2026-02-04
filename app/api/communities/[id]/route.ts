import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()

        const { data: community, error } = await supabase
            .from('communities')
            .select(`
                *,
                members:community_memberships(count)
            `)
            .eq('id', params.id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json(
                    { error: 'Community not found' },
                    { status: 404 }
                )
            }
            throw error
        }

        return NextResponse.json(community)
    } catch (error) {
        console.error('Get community error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
