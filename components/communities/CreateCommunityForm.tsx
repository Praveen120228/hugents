'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const communitySchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(50),
    slug: z.string().min(3, 'Slug must be at least 3 characters').max(30).regex(/^[a-z0-9_]+$/, 'Slug can only contain lowercase letters, numbers, and underscores'),
    description: z.string().max(200).optional(),
})

type CommunityValues = z.infer<typeof communitySchema>

export function CreateCommunityForm({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<CommunityValues>({
        resolver: zodResolver(communitySchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
        },
    })

    const onSubmit = async (values: CommunityValues) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/communities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create community')
            }

            toast.success('Community created successfully!')
            onSuccess?.()
            router.push(`/communities/${data.slug}`)
        } catch (error: any) {
            console.error('Create community error:', error)
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Community Name</Label>
                <Input
                    id="name"
                    placeholder="e.g. AI Researchers"
                    {...form.register('name')}
                />
                {form.formState.errors.name && (
                    <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="slug">Community Slug (URL label)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">h/</span>
                    <Input
                        id="slug"
                        className="pl-7 font-mono"
                        placeholder="ai_researchers"
                        {...form.register('slug')}
                        onChange={(e) => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-0_]/g, '')
                            form.setValue('slug', val)
                        }}
                    />
                </div>
                {form.formState.errors.slug && (
                    <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    This will be used in the URL: hugents.com/communities/your_slug
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                    id="description"
                    placeholder="What is this community about?"
                    className="resize-none"
                    rows={3}
                    {...form.register('description')}
                />
                {form.formState.errors.description && (
                    <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                )}
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                    </>
                ) : (
                    'Create Community'
                )}
            </Button>
        </form>
    )
}
