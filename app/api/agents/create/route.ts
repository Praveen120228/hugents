import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { encryptApiKey } from '@/lib/crypto/encryption'

const createAgentSchema = z.object({
    provider: z.enum(['anthropic', 'openai', 'gemini', 'openrouter']),
    apiKey: z.string().min(10, 'API key is required').optional(),
    apiKeyId: z.string().uuid().optional(),
    apiKeyLabel: z.string().max(100).optional(),
    agentName: z.string().min(2, 'Agent name must be at least 2 characters').max(50),
    personality: z.string().min(20, 'Personality description must be at least 20 characters'),
    beliefs: z.record(z.string(), z.any()).optional(),
    avatarUrl: z.string().url().optional(),
    model: z.string().optional(),
}).refine(
    (data) => data.apiKey || data.apiKeyId,
    { message: 'Either apiKey or apiKeyId must be provided' }
)

export async function POST(request: Request) {
    try {
        const supabase = await createClient()

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.error('Authentication error:', authError)
            return NextResponse.json(
                { error: 'You must be signed in to create an agent' },
                { status: 401 }
            )
        }

        const body = await request.json()
        console.log('Received request body:', { ...body, apiKey: '[REDACTED]' })

        // Validate input
        const validationResult = createAgentSchema.safeParse(body)

        if (!validationResult.success) {
            console.error('Validation error:', validationResult.error)
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const data = validationResult.data

        // Check if agent name is already taken
        const { data: existingAgent } = await supabase
            .from('agents')
            .select('id')
            .eq('name', data.agentName)
            .single()

        if (existingAgent) {
            console.log('Agent name already taken:', data.agentName)
            return NextResponse.json(
                { error: 'This agent name is already taken' },
                { status: 400 }
            )
        }

        let apiKeyId: string

        // Check if using existing API key or creating a new one
        if (data.apiKeyId) {
            // Use existing API key
            console.log('Using existing API key:', data.apiKeyId)

            // Verify the API key belongs to the user
            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from('api_keys')
                .select('id, provider')
                .eq('id', data.apiKeyId)
                .eq('user_id', user.id)
                .eq('is_active', true)
                .single()

            if (apiKeyError || !apiKeyData) {
                console.error('API key not found or unauthorized:', apiKeyError)
                return NextResponse.json(
                    { error: 'Invalid API key selected' },
                    { status: 400 }
                )
            }

            // Verify provider matches
            if (apiKeyData.provider !== data.provider) {
                return NextResponse.json(
                    { error: `Selected API key is for ${apiKeyData.provider}, but agent requires ${data.provider}` },
                    { status: 400 }
                )
            }

            apiKeyId = data.apiKeyId
        } else if (data.apiKey) {
            // Create new API key
            console.log('Creating new API key...')
            const { encrypted: encryptedKey, fingerprint } = encryptApiKey(data.apiKey)

            const { data: apiKeyData, error: apiKeyError } = await supabase
                .from('api_keys')
                .insert({
                    user_id: user.id,
                    provider: data.provider,
                    encrypted_key: encryptedKey,
                    key_fingerprint: fingerprint,
                    is_active: true,
                    usage_count: 0,
                    usage_limit: 1000000,
                    label: data.apiKeyLabel || `${data.provider} key`,
                })
                .select()
                .single()

            if (apiKeyError) {
                console.error('API key creation error:', apiKeyError)
                return NextResponse.json(
                    { error: `Failed to create API key: ${apiKeyError.message}` },
                    { status: 500 }
                )
            }

            console.log('API key created successfully:', apiKeyData.id)
            apiKeyId = apiKeyData.id
        } else {
            return NextResponse.json(
                { error: 'Either apiKey or apiKeyId must be provided' },
                { status: 400 }
            )
        }

        // Create the agent with the API key reference
        const agentData = {
            user_id: user.id,
            name: data.agentName,
            personality: data.personality,
            beliefs: data.beliefs || {},
            model: data.model || 'claude-3-5-sonnet-20241022',
            autonomy_level: 'manual',
            api_key_id: apiKeyId,
        }

        console.log('Creating agent with data:', agentData)

        const { data: agent, error: agentError } = await supabase
            .from('agents')
            .insert(agentData)
            .select()
            .single()

        if (agentError) {
            console.error('Agent creation error:', agentError)
            return NextResponse.json(
                { error: `Failed to create agent: ${agentError.message}` },
                { status: 500 }
            )
        }

        console.log('Agent created successfully:', agent.id)
        return NextResponse.json({
            success: true,
            agent,
            message: 'Agent created successfully!',
        })
    } catch (error) {
        console.error('Unexpected error in agent creation:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
