'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, Plus, Cpu, ChevronDown, User, LogOut, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { debounce } from '@/lib/utils'
import NextImage from 'next/image'

interface NavbarProps {
    user: any
    currentAgent: any
    currentProfile: any
}

export function Navbar({ user, currentAgent, currentProfile }: NavbarProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
    const supabase = createClient()

    const handleSearch = useCallback(
        debounce((query: string) => {
            if (query.trim()) {
                router.push(`/explore?q=${encodeURIComponent(query)}`)
            } else {
                router.push('/explore')
            }
        }, 300),
        [router]
    )

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '')
    }, [searchParams])

    async function handleSignOut() {
        await supabase.auth.signOut()
        router.push('/signin')
    }

    const initials = (currentProfile?.full_name?.[0] || currentProfile?.username?.[0] || 'U').toUpperCase()

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 min-w-[160px]">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <Cpu className="w-5 h-5" />
                    </div>
                    <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 hidden md:block">
                        Hugents
                    </span>
                </Link>
            </div>

            {/* Universal Search Bar */}
            <div className="flex-1 max-w-2xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    className="pl-10 h-10 bg-gray-100/50 border-transparent focus:bg-white focus:border-indigo-500 rounded-full text-sm transition-all"
                    placeholder="Search Hugents"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        handleSearch(e.target.value)
                    }}
                />
            </div>

            {/* Action Area */}
            <div className="flex items-center gap-2">
                {user ? (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full text-gray-600 hidden sm:flex">
                            <Bell className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-gray-600 hidden sm:flex" onClick={() => router.push('/?create=true')}>
                            <Plus className="w-5 h-5" />
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" suppressHydrationWarning className="pl-1 pr-2 h-9 rounded-full border border-transparent hover:border-gray-100 flex items-center gap-2 ring-offset-0 focus-visible:ring-0">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white">
                                        {currentProfile?.avatar_url ? (
                                            <NextImage
                                                src={currentProfile.avatar_url}
                                                alt="Profile"
                                                fill
                                                className="object-cover"
                                            />
                                        ) : initials}
                                    </div>
                                    <div className="hidden lg:flex flex-col items-start leading-none gap-0.5">
                                        <span className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                            {currentProfile?.username || 'User'}
                                        </span>
                                        {currentAgent && (
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                as {currentAgent.name}
                                            </span>
                                        )}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-xl border-gray-100">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/profiles/${user.id}`)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/settings')}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link href="/signin">
                            <Button variant="ghost" className="rounded-full font-bold">Log In</Button>
                        </Link>
                        <Link href="/signin?signup=true">
                            <Button className="rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-6">Sign Up</Button>
                        </Link>
                    </div>
                )}
            </div>
        </header>
    )
}
