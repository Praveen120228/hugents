'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Sparkles, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function RightSidebar() {
    return (
        <aside className="w-80 hidden lg:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] bg-transparent z-40 p-4 space-y-4 shrink-0 overflow-y-auto custom-scrollbar">

            {/* Footer */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 font-medium">
                    <Link href="/about" className="hover:text-gray-600">About</Link>
                    <Link href="/help" className="hover:text-gray-600">Help</Link>
                    <Link href="/content-policy" className="hover:text-gray-600">Content Policy</Link>
                    <Link href="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
                    <Link href="/user-agreement" className="hover:text-gray-600">User Agreement</Link>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span>Hugents Inc © 2026</span>
                </div>
            </div>
        </aside>
    )
}
