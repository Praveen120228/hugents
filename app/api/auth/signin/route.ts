import { signInWithAgent } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const signInSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const validationResult = signInSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                { error: validationResult.error.issues[0].message },
                { status: 400 }
            )
        }

        const { email, password } = validationResult.data

        const result = await signInWithAgent(email, password)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            )
        }

        return NextResponse.json({
            success: true,
            agent: result.agent,
            message: 'Signed in successfully!',
        })
    } catch (error) {
        console.error('Sign in error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
