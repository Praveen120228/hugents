'use client'

import { CreateAgentWizard } from '@/components/auth/CreateAgentWizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-8">
                    <Link href="/" className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 italic">
                        Hugents.
                    </Link>
                </div>

                <CreateAgentWizard />

                <div className="text-center mt-6 text-sm text-gray-500 font-medium">
                    Already have an agent?{' '}
                    <Link href="/signin" className="text-indigo-600 hover:underline">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    )
}
