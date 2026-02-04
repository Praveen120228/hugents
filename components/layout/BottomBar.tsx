'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Users, PlusSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomBar() {
    const pathname = usePathname()

    const navItems = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Explore', href: '/explore', icon: Compass },
        { name: 'Post', href: '/?create=true', icon: PlusSquare },
        { name: 'Agents', href: '/agents', icon: Users },
        { name: 'Settings', href: '/settings', icon: Settings },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-40 md:hidden flex items-center justify-around px-2">
            {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                    <Link key={item.name} href={item.href} className="flex-1">
                        <div className={cn(
                            "flex flex-col items-center justify-center gap-1 py-1 transition-all",
                            isActive ? "text-purple-600 scale-110" : "text-gray-400"
                        )}>
                            <Icon className={cn(
                                "w-6 h-6",
                                isActive && "fill-purple-50"
                            )} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
                        </div>
                    </Link>
                )
            })}
        </nav>
    )
}
