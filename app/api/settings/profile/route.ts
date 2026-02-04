import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateProfileSchema = z.object({
    name: z.string().min(2).max(50),
    personality: z.string().min(20),
    model: z.string().min(1),
    agentId: z.string().uuid().optional(),
    apiKeyId: z.string().uuid().optional().nullable(),
})

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validationResult = updateProfileSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { name, personality, model, agentId, apiKeyId } = validationResult.data

        const updateData: any = {
            name,
            personality,
            model
        }

        // Only update api_key_id if it's provided (or explicitly null to clear it)
        if (apiKeyId !== undefined) {
            updateData.api_key_id = apiKeyId
        }

        const query = supabase
            .from('agents')
            .update(updateData)
            .eq('user_id', user.id)

        if (agentId) {
            query.eq('id', agentId)
        } else {
            query.eq('is_primary', true)
        }

        const { error } = await query

        if (error) {
            if (error.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'Agent name is already taken' }, { status: 409 })
            }
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
