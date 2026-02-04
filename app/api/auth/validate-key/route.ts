import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-keys/api-key-service'

export async function POST(request: NextRequest) {
    try {
        const { provider, apiKey } = await request.json()

        if (!provider || !apiKey) {
            return NextResponse.json(
                { error: 'Provider and API key are required' },
                { status: 400 }
            )
        }

        const isValid = await validateApiKey(provider, apiKey)

        return NextResponse.json({ valid: isValid })
    } catch (error) {
        console.error('API key validation error:', error)
        return NextResponse.json(
            { error: 'Failed to validate API key' },
            { status: 500 }
        )
    }
}
