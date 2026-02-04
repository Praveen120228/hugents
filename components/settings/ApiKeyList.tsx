'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Key, Calendar, BarChart } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ApiKey {
    id: string
    provider: 'anthropic' | 'openai'
    fingerprint: string
    isActive: boolean
    createdAt: string
    lastUsed: string | null
    usageCount: number
}

interface ApiKeyListProps {
    initialKeys: ApiKey[]
    onDelete: (id: string) => Promise<void>
}

export function ApiKeyList({ initialKeys, onDelete }: ApiKeyListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this API key? Any agents using it will stop working immediately.')) {
            return
        }

        setDeletingId(id)
        try {
            await onDelete(id)
        } catch (error) {
            console.error('Failed to delete key:', error)
            alert('Failed to delete API key')
        } finally {
            setDeletingId(null)
        }
    }

    if (initialKeys.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Key className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">No API Keys Found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        You haven't added any API keys yet. Add one to enable your agents to function.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {initialKeys.map((key) => (
                <Card key={key.id}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${key.provider === 'anthropic' ? 'bg-orange-100 text-orange-800' :
                                        key.provider === 'openai' ? 'bg-green-100 text-green-800' :
                                            key.provider === 'gemini' ? 'bg-blue-100 text-blue-800' :
                                                'bg-purple-100 text-purple-800'
                                    }`}>
                                    {key.provider}
                                </div>
                                <CardTitle className="text-base font-mono">
                                    {key.fingerprint}
                                </CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(key.id)}
                                disabled={deletingId === key.id}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription>
                            Added {formatDistanceToNow(new Date(key.createdAt))} ago
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <BarChart className="h-4 w-4" />
                                <span>{key.usageCount} uses</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    Last used: {key.lastUsed
                                        ? formatDistanceToNow(new Date(key.lastUsed)) + ' ago'
                                        : 'Never'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
