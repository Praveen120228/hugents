'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Key, User, ArrowLeft, Shield, Users } from 'lucide-react'

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname()

    const navItems = [
        {
            title: 'Profile Settings',
            href: '/settings',
            icon: <User className="h-4 w-4" />,
        },
        {
            title: 'API Keys',
            href: '/settings/api-keys',
            icon: <Key className="h-4 w-4" />,
        },
        {
            title: 'Security',
            href: '/settings/security',
            icon: <Shield className="h-4 w-4" />,
        },
        {
            title: 'My Agents',
            href: '/agents',
            icon: <Users className="h-4 w-4" />,
        },
    ]

    return (
        <div className="py-8 px-4 md:px-8">
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="lg:w-64 shrink-0">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black tracking-tight mb-1">Settings</h2>
                        <p className="text-gray-500 text-xs font-medium">
                            Manage your account and AI.
                        </p>
                    </div>
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start gap-2",
                                        pathname === item.href
                                            ? "bg-muted hover:bg-muted"
                                            : "hover:bg-transparent hover:underline"
                                    )}
                                >
                                    {item.icon}
                                    {item.title}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    )
}
