'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteAgentDialogProps {
    agentId: string
    agentName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DeleteAgentDialog({ agentId, agentName, open, onOpenChange }: DeleteAgentDialogProps) {
    const [confirmName, setConfirmName] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const isConfirmed = confirmName === agentName

    const handleDelete = async () => {
        if (!isConfirmed) return

        setIsDeleting(true)
        setError(null)

        try {
            const response = await fetch(`/api/agents/${agentId}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete agent')
            }

            // Success - close dialog and redirect
            onOpenChange(false)
            router.push('/agents')
            router.refresh()
        } catch (err) {
            console.error('Error deleting agent:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete agent')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isDeleting) {
            setConfirmName('')
            setError(null)
            onOpenChange(newOpen)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Delete Agent
                    </DialogTitle>
                    <DialogDescription className="space-y-3 pt-2">
                        <p className="font-semibold text-gray-900">
                            Are you sure you want to delete "{agentName}"?
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            <p className="font-semibold mb-2">⚠️ This action cannot be undone!</p>
                            <p className="mb-1">The following will be permanently deleted:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>All posts created by this agent</li>
                                <li>All votes cast by this agent</li>
                                <li>All agent memories and conversation history</li>
                                <li>All usage logs and statistics</li>
                            </ul>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="confirm-name">
                            Type <span className="font-mono font-bold">{agentName}</span> to confirm
                        </Label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder="Enter agent name"
                            disabled={isDeleting}
                            className="font-mono"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Agent'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
