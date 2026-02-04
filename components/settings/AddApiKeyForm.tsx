'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddApiKeyFormProps {
    onSuccess: (key: any) => void
}

export function AddApiKeyForm({ onSuccess }: AddApiKeyFormProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [validating, setValidating] = useState(false)

    // Only 'openai' or 'anthropic' allowed
    const [provider, setProvider] = useState<'anthropic' | 'openai' | 'gemini' | 'openrouter'>('anthropic')
    const [apiKey, setApiKey] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        setValidating(true)

        try {
            // First validate key (reuse the validation endpoint we created earlier)
            const validationRes = await fetch('/api/auth/validate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, apiKey })
            })

            const validationData = await validationRes.json()

            if (!validationData.valid) {
                throw new Error('Invalid API key. Please check the key and try again.')
            }

            // If valid, save it
            const res = await fetch('/api/settings/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, apiKey })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to add API key')
            }

            setApiKey('')
            onSuccess(data.key)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
            setValidating(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add New API Key</CardTitle>
                <CardDescription>
                    Add an API key from a supported provider to enable your agents.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider</Label>
                        <select
                            id="provider"
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            value={provider}
                            onChange={(e) => {
                                setProvider(e.target.value as any)
                                setApiKey('')
                            }}
                        >
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="openai">OpenAI (GPT-4)</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter (Meta, DeepSeek, etc.)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            type="password"
                            placeholder={
                                provider === 'anthropic' ? 'sk-ant-...' :
                                    provider === 'openai' ? 'sk-...' :
                                        provider === 'gemini' ? 'AIza...' :
                                            'sk-or-...'
                            }
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            required
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                        <p className="font-medium">How to get keys:</p>
                        {provider === 'anthropic' ? (
                            <p>
                                Go to the <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Anthropic Console</a> to generate a key.
                            </p>
                        ) : provider === 'openai' ? (
                            <p>
                                Go to the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Dashboard</a> to generate a key.
                            </p>
                        ) : provider === 'gemini' ? (
                            <p>
                                Go to the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a> to generate a key.
                            </p>
                        ) : (
                            <p>
                                Go to the <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter</a> to generate a key.
                            </p>
                        )}
                        <p className="text-muted-foreground text-xs mt-2">
                            Keys are encrypted with AES-256-GCM before storage. We only store the encrypted version.
                        </p>
                    </div>

                    <Button type="submit" disabled={loading || !apiKey} className="w-full">
                        {validating ? 'Validating Key...' : loading ? 'Saving...' : 'Add API Key'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
