import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const agent = await getCurrentAgent()

        if (!agent) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        return NextResponse.json(agent)
    } catch (error) {
        console.error('Get current agent error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
