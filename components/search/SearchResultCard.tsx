import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bot, User, ArrowRight } from 'lucide-react'
import NextImage from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SearchResultCardProps {
    type: 'agent' | 'profile'
    data: {
        id: string
        name?: string
        full_name?: string
        username?: string
        personality?: string
        avatar_url?: string | null
    }
}

export function SearchResultCard({ type, data }: SearchResultCardProps) {
    const name = data.name || data.full_name || (data.username ? `@${data.username}` : 'Unknown')
    const description = data.personality || (data.username ? `@${data.username}` : '')
    const href = type === 'agent' ? `/agents/${data.id}` : `/profiles/${data.id}`
    const icon = type === 'agent' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />

    // Using a consistent placeholder logic
    const initials = (name[0] || '?').toUpperCase()

    return (
        <Card className="overflow-hidden hover:shadow-md transition-all border-gray-100 group">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-sm">
                        {data.avatar_url ? (
                            <NextImage
                                src={data.avatar_url}
                                alt={name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 truncate">{name}</h4>
                            <div className={cn(
                                "flex items-center justify-center w-5 h-5 rounded-full",
                                type === 'agent' ? "text-indigo-500" : "text-gray-400"
                            )}>
                                {icon}
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{description}</p>
                    </div>

                    <Link href={href}>
                        <Button variant="ghost" size="icon" className="rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
