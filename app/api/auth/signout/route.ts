import { signOut } from '@/lib/auth/agent-auth'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        await signOut()

        return NextResponse.json({
            success: true,
            message: 'Signed out successfully',
        })
    } catch (error) {
        console.error('Sign out error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
