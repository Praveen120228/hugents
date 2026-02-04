'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home,
    Compass,
    Users,
    Settings,
    LogOut,
    Cpu,
    PlusSquare,
    User,
    SquarePen,
    History,
    TrendingUp,
    MessageSquare,
    Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [recentCommunities, setRecentCommunities] = useState<any[]>([])

    useEffect(() => {
        // Load recent communities from localStorage
        const stored = localStorage.getItem('recent_communities')
        if (stored) {
            try {
                setRecentCommunities(JSON.parse(stored).slice(0, 5))
            } catch (e) {
                console.error('Failed to parse recent communities', e)
            }
        }
    }, [])

    async function handleSignOut() {
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error('Error signing out')
        } else {
            router.push('/signin')
        }
    }

    const mainNav = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Popular', href: '/popular', icon: TrendingUp },
        { name: 'Explore', href: '/explore', icon: Compass },
        { name: 'All', href: '/all', icon: Hash },
    ]

    const resources = [
        { name: 'Communities', href: '/communities', icon: MessageSquare }, // Could point to a listing
    ]

    return (
        <aside className="w-64 hidden md:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] border-r border-gray-100 bg-white z-40 p-4 shrink-0">
            <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                {/* Main Navigation */}
                <div className="space-y-1">
                    {mainNav.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link key={item.name} href={item.href}>
                                <div className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group group-hover:bg-gray-100",
                                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
                                )}>
                                    <Icon className={cn(
                                        "w-5 h-5",
                                        isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                                    )} />
                                    <span className={cn(
                                        "font-medium text-sm",
                                        isActive ? "text-gray-900" : "text-gray-600"
                                    )}>
                                        {item.name}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Recents Section */}
                {recentCommunities.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span>Recent</span>
                            <History className="w-3 h-3" />
                        </div>
                        <div className="space-y-1">
                            {recentCommunities.map((c) => (
                                <Link key={c.id} href={`/communities/${c.slug}`}>
                                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group">
                                        <div className="w-5 h-5 rounded-md bg-indigo-50 flex items-center justify-center text-[10px] text-indigo-600 font-bold border border-indigo-100">
                                            h/
                                        </div>
                                        <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate">h/{c.slug}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Resources */}
                <div className="space-y-2">
                    <div className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Resources
                    </div>
                    <div className="space-y-1">
                        {resources.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href

                            return (
                                <Link key={item.name} href={item.href}>
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group group-hover:bg-gray-100",
                                        isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
                                    )}>
                                        <Icon className={cn(
                                            "w-5 h-5",
                                            isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                                        )} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </nav>

            {/* Bottom Section */}
            <div className="pt-4 border-t border-gray-100 space-y-1">
                <Link href="/settings">
                    <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group group-hover:bg-gray-100",
                        pathname === '/settings' ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
                    )}>
                        <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                        <span className="text-sm font-medium">Settings</span>
                    </div>
                </Link>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg h-10 px-3"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Sign Out</span>
                </Button>
            </div>
        </aside>
    )
}
