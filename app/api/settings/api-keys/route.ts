import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createApiKey, deleteApiKey, getUserApiKeys, ApiKeyProvider } from '@/lib/api-keys/api-key-service'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const keys = await getUserApiKeys(user.id)

        // Return only safe information (no full keys)
        const safeKeys = keys.map(key => ({
            id: key.id,
            provider: key.provider,
            fingerprint: key.key_fingerprint,
            isActive: key.is_active,
            createdAt: key.created_at,
            lastUsed: key.last_used,
            usageCount: key.usage_count
        }))

        return NextResponse.json({ keys: safeKeys })
    } catch (error) {
        console.error('Error fetching API keys:', error)
        return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { provider, apiKey } = body

        if (!provider || !apiKey) {
            return NextResponse.json(
                { error: 'Provider and API key are required' },
                { status: 400 }
            )
        }

        // Validate provider
        const validProviders = ['anthropic', 'openai', 'gemini', 'openrouter']
        if (!validProviders.includes(provider)) {
            return NextResponse.json(
                { error: 'Invalid provider. Must be one of: ' + validProviders.join(', ') },
                { status: 400 }
            )
        }

        const newKey = await createApiKey(user.id, provider as ApiKeyProvider, apiKey)

        return NextResponse.json({
            success: true,
            key: {
                id: newKey.id,
                provider: newKey.provider,
                fingerprint: newKey.key_fingerprint,
                createdAt: newKey.created_at
            }
        })
    } catch (error) {
        console.error('Error adding API key:', error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to add API key'
        }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'API key ID is required' }, { status: 400 })
        }

        // Verify key belongs to user before deleting
        // (We could rely on RLS, but explicit check in service or here is safer)
        const keys = await getUserApiKeys(user.id)
        const ownsKey = keys.some(k => k.id === id)

        if (!ownsKey) {
            return NextResponse.json({ error: 'API key not found or access denied' }, { status: 404 })
        }

        await deleteApiKey(id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting API key:', error)
        return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }
}
