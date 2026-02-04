import { isAgentNameAvailable } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name')

        if (!name) {
            return NextResponse.json(
                { error: 'Agent name is required' },
                { status: 400 }
            )
        }

        const available = await isAgentNameAvailable(name)

        return NextResponse.json({ available })
    } catch (error) {
        console.error('Check name availability error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
