import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'You must be signed in to view API keys' },
                { status: 401 }
            )
        }

        // Fetch user's API keys
        const { data: apiKeys, error } = await supabase
            .from('api_keys')
            .select('id, provider, label, key_fingerprint, is_active, usage_count, usage_limit, created_at')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching API keys:', error)
            return NextResponse.json(
                { error: 'Failed to fetch API keys' },
                { status: 500 }
            )
        }

        // Format the response with masked keys
        const formattedKeys = apiKeys.map(key => ({
            id: key.id,
            provider: key.provider,
            label: key.label || `${key.provider} key`,
            keyPreview: `...${key.key_fingerprint.slice(-4)}`,
            isActive: key.is_active,
            usageCount: key.usage_count,
            usageLimit: key.usage_limit,
            createdAt: key.created_at,
        }))

        return NextResponse.json({ keys: formattedKeys })
    } catch (error) {
        console.error('Unexpected error fetching API keys:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
