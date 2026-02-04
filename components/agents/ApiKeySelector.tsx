'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Key, Plus, Loader2 } from 'lucide-react'

interface ApiKey {
    id: string
    provider: string
    label: string
    keyPreview: string
    isActive: boolean
    usageCount: number
    usageLimit: number
    createdAt: string
}

interface ApiKeySelectorProps {
    provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter'
    onSelect: (selection: { apiKeyId?: string; apiKey?: string; apiKeyLabel?: string }) => void
    selectedKeyId?: string
}

export function ApiKeySelector({ provider, onSelect, selectedKeyId }: ApiKeySelectorProps) {
    const [keys, setKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [mode, setMode] = useState<'existing' | 'new'>('existing')
    const [newApiKey, setNewApiKey] = useState('')
    const [newKeyLabel, setNewKeyLabel] = useState('')
    const [selectedKey, setSelectedKey] = useState<string | undefined>(selectedKeyId)

    useEffect(() => {
        fetchApiKeys()
    }, [])

    async function fetchApiKeys() {
        try {
            const response = await fetch('/api/api-keys')
            if (response.ok) {
                const data = await response.json()
                const providerKeys = data.keys.filter((k: ApiKey) => k.provider === provider)
                setKeys(providerKeys)

                // Auto-select first key if available and no selection made
                if (providerKeys.length > 0 && !selectedKeyId) {
                    setSelectedKey(providerKeys[0].id)
                    onSelect({ apiKeyId: providerKeys[0].id })
                } else if (providerKeys.length === 0) {
                    setMode('new')
                }
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
        } finally {
            setLoading(false)
        }
    }

    function handleKeySelection(keyId: string) {
        setSelectedKey(keyId)
        onSelect({ apiKeyId: keyId })
    }

    function handleNewKeyInput() {
        if (newApiKey.trim()) {
            onSelect({
                apiKey: newApiKey.trim(),
                apiKeyLabel: newKeyLabel.trim() || `${provider} key`
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold">API Key Configuration</h3>
            </div>

            {keys.length > 0 && (
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={mode === 'existing' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('existing')}
                    >
                        Use Existing Key
                    </Button>
                    <Button
                        variant={mode === 'new' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('new')}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add New Key
                    </Button>
                </div>
            )}

            {mode === 'existing' && keys.length > 0 ? (
                <div className="space-y-3">
                    {keys.map((key) => (
                        <label
                            key={key.id}
                            className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selectedKey === key.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                }`}
                        >
                            <input
                                type="radio"
                                name="api-key"
                                value={key.id}
                                checked={selectedKey === key.id}
                                onChange={() => handleKeySelection(key.id)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{key.label}</p>
                                        <p className="text-sm text-gray-500">
                                            Key: {key.keyPreview}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full capitalize">
                                            {key.provider}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {key.usageCount} / {key.usageLimit} uses
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            ) : (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder={`Enter your ${provider} API key`}
                            value={newApiKey}
                            onChange={(e) => {
                                setNewApiKey(e.target.value)
                                handleNewKeyInput()
                            }}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="keyLabel">Label (Optional)</Label>
                        <Input
                            id="keyLabel"
                            type="text"
                            placeholder={`e.g., "My ${provider} Key"`}
                            value={newKeyLabel}
                            onChange={(e) => {
                                setNewKeyLabel(e.target.value)
                                handleNewKeyInput()
                            }}
                            className="mt-1"
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        This key will be encrypted and saved for future use.
                    </p>
                </div>
            )}
        </div>
    )
}
