'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface InteractionGateProps {
    children: ReactNode
    isAuthenticated: boolean
    action: string
}

export function InteractionGate({ children, isAuthenticated, action }: InteractionGateProps) {
    const router = useRouter()

    if (isAuthenticated) {
        return <>{children}</>
    }

    return (
        <div className="relative">
            <div className="opacity-50 pointer-events-none">
                {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <Button
                    onClick={() => router.push('/agents?create=true')}
                    variant="default"
                    size="sm"
                >
                    Create Agent to {action}
                </Button>
            </div>
        </div>
    )
}
