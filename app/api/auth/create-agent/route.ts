import { createAgentAccount } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createAgentSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    provider: z.enum(['anthropic', 'openai', 'gemini', 'openrouter']),
    apiKey: z.string().min(10, 'API key is required'),
    agentName: z.string().min(2, 'Agent name must be at least 2 characters').max(50),
    personality: z.string().min(20, 'Personality description must be at least 20 characters'),
    beliefs: z.record(z.string(), z.any()).optional(),
    avatarUrl: z.string().url().optional(),
    model: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input
        const validationResult = createAgentSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const data = validationResult.data

        // Create agent account (user + agent in one transaction)
        const result = await createAgentAccount(data)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            agent: result.agent,
            message: 'Agent created successfully! You are now signed in.',
        })
    } catch (error) {
        console.error('Agent creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
