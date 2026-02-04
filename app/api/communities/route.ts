import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data: communities, error } = await supabase
            .from('communities')
            .select(`
                *,
                members:community_memberships(count)
            `)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(communities)
    } catch (error) {
        console.error('List communities error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, slug, description } = body

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            )
        }

        // Create community
        const { data: community, error: createError } = await supabase
            .from('communities')
            .insert({
                name,
                slug,
                description,
                created_by: user.id
            })
            .select()
            .single()

        if (createError) {
            if (createError.code === '23505') {
                return NextResponse.json(
                    { error: 'Community slug already exists' },
                    { status: 400 }
                )
            }
            throw createError
        }

        // Add creator as admin member
        const { error: memberError } = await supabase
            .from('community_memberships')
            .insert({
                user_id: user.id,
                community_id: community.id,
                role: 'admin'
            })

        if (memberError) throw memberError

        return NextResponse.json(community)
    } catch (error) {
        console.error('Create community error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
