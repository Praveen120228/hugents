'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiKeySelector } from '@/components/agents/ApiKeySelector'

interface AgentProfileFormProps {
    initialData: {
        id: string
        name: string
        personality: string
        model: string
        apiKeyId?: string | null
    }
}

// Helper to determine provider from model
function getProviderFromModel(model: string): 'anthropic' | 'openai' | 'gemini' | 'openrouter' {
    if (model.startsWith('gpt') || model.startsWith('o1')) return 'openai'
    if (model.startsWith('gemini')) return 'gemini'
    if (model.includes('/')) return 'openrouter'
    return 'anthropic'
}

export function AgentProfileForm({ initialData }: AgentProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        name: initialData.name,
        personality: initialData.personality,
        model: initialData.model || 'claude-3-5-sonnet-20240620',
        apiKeyId: initialData.apiKeyId || undefined
    })

    const [provider, setProvider] = useState<'anthropic' | 'openai' | 'gemini' | 'openrouter'>(
        getProviderFromModel(initialData.model || 'claude-3-5-sonnet-20240620')
    )

    // Update provider when model changes
    useEffect(() => {
        setProvider(getProviderFromModel(formData.model))
    }, [formData.model])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await fetch('/api/settings/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    agentId: initialData.id
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update profile')
            }

            setSuccess('Profile updated successfully')
            router.refresh()
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agent Profile</CardTitle>
                <CardDescription>
                    Update your agent&apos;s identity and brain configuration.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Agent Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="My Awesome Agent"
                            minLength={2}
                            maxLength={50}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="model">AI Model</Label>
                        <select
                            id="model"
                            className="w-full px-3 py-2 border rounded-md"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        >
                            <optgroup label="Anthropic">
                                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (New)</option>
                                <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast)</option>
                                <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                            </optgroup>
                            <optgroup label="OpenAI">
                                <option value="gpt-4o">GPT-4o</option>
                                <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                                <option value="o1-preview">o1 Preview (Reasoning)</option>
                            </optgroup>
                            <optgroup label="Google">
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview (Experimental)</option>
                            </optgroup>
                            <optgroup label="OpenRouter">
                                <option value="meta-llama/llama-3.1-405b-instruct">Llama 3.1 405B</option>
                                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (via OR)</option>
                                <option value="google/gemini-flash-1.5">Gemini 1.5 Flash (via OR)</option>
                            </optgroup>
                        </select>
                        <p className="text-sm text-muted-foreground">
                            Select the AI model that powers your agent. Ensure you have the corresponding API key added.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <ApiKeySelector
                            provider={provider}
                            selectedKeyId={formData.apiKeyId}
                            onSelect={({ apiKeyId }) => setFormData(prev => ({ ...prev, apiKeyId }))}
                        />
                        <p className="text-sm text-muted-foreground">
                            Select the API key for the chosen provider ({provider}).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="personality">Personality & System Prompt</Label>
                        <Textarea
                            id="personality"
                            value={formData.personality}
                            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                            placeholder="Describe how your agent thinks and behaves..."
                            rows={8}
                            minLength={20}
                        />
                        <p className="text-sm text-muted-foreground">
                            This is the prompt that defines your agent&apos;s behavior.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm">
                            {success}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card >
    )
}
