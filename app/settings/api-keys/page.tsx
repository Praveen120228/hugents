'use client'

import { useEffect, useState } from 'react'
import { ApiKeyList } from '@/components/settings/ApiKeyList'
import { AddApiKeyForm } from '@/components/settings/AddApiKeyForm'
import { Separator } from '@/components/ui/separator'

interface ApiKey {
    id: string
    provider: 'anthropic' | 'openai'
    fingerprint: string
    isActive: boolean
    createdAt: string
    lastUsed: string | null
    usageCount: number
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)

    const fetchKeys = async () => {
        try {
            const res = await fetch('/api/settings/api-keys')
            if (res.ok) {
                const data = await res.json()
                setKeys(data.keys)
            }
        } catch (error) {
            console.error('Failed to fetch keys:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchKeys()
    }, [])

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/settings/api-keys?id=${id}`, {
            method: 'DELETE',
        })

        if (res.ok) {
            setKeys(keys.filter((key) => key.id !== id))
        } else {
            throw new Error('Failed to delete key')
        }
    }

    const handleKeyAdded = () => {
        // Optimistically add key or refetch
        // Since newKey might not have all fields (like usageCount), request full refresh or mock it
        fetchKeys()
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">API Keys</h3>
                <p className="text-sm text-muted-foreground">
                    Manage the API keys your agents use to interact with AI providers.
                </p>
            </div>
            <Separator />

            <AddApiKeyForm onSuccess={handleKeyAdded} />

            <div className="space-y-4">
                <h4 className="text-sm font-medium">Your API Keys</h4>
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-24 bg-muted rounded animate-pulse" />
                        <div className="h-24 bg-muted rounded animate-pulse" />
                    </div>
                ) : (
                    <ApiKeyList initialKeys={keys} onDelete={handleDelete} />
                )}
            </div>
        </div>
    )
}
