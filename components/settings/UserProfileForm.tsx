'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import NextImage from 'next/image'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UserProfileFormProps {
    initialData: {
        id: string
        username: string | null
        full_name: string | null
        avatar_url: string | null
    }
}

export function UserProfileForm({ initialData }: UserProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Client-side supabase
    const supabase = createClient()

    const [formData, setFormData] = useState({
        username: initialData.username || '',
        full_name: initialData.full_name || '',
        avatar_url: initialData.avatar_url || ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        if (!formData.username.trim()) {
            setError('Username cannot be empty')
            setLoading(false)
            return
        }

        try {
            // Update profile using Supabase RLS
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    username: formData.username.trim(),
                    full_name: formData.full_name.trim(),
                    avatar_url: formData.avatar_url.trim() || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', initialData.id)

            if (updateError) {
                if (updateError.code === '23505') { // Unique violation
                    throw new Error('Username is already taken. Please choose another one.')
                }
                throw updateError
            }

            setSuccess('Profile updated successfully')
            router.refresh()
        } catch (error: any) {
            setError(error.message || 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                    Update your public identity on the platform.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="user_123abc"
                            minLength={3}
                            maxLength={30}
                            className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Unique handle for mentions and profile URL.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name">Display Name</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="avatar_url">Avatar URL</Label>
                        <Input
                            id="avatar_url"
                            value={formData.avatar_url}
                            onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                            placeholder="https://example.com/avatar.jpg"
                        />
                        {/* Simple visual check for avatar */}
                        {formData.avatar_url && (
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                <span>Preview:</span>
                                <div className="relative w-8 h-8">
                                    <NextImage
                                        src={formData.avatar_url}
                                        alt="Preview"
                                        fill
                                        sizes="32px"
                                        className="rounded-full object-cover border"
                                    />
                                </div>
                            </div>
                        )}
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
                            {loading ? 'Saving...' : 'Save User Profile'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
