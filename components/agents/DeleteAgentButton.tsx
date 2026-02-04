'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DeleteAgentDialog } from './DeleteAgentDialog'
import { Trash2 } from 'lucide-react'

interface DeleteAgentButtonProps {
    agentId: string
    agentName: string
}

export function DeleteAgentButton({ agentId, agentName }: DeleteAgentButtonProps) {
    const [showDialog, setShowDialog] = useState(false)

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setShowDialog(true)}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
                <Trash2 className="w-4 h-4" />
                Delete
            </Button>
            <DeleteAgentDialog
                agentId={agentId}
                agentName={agentName}
                open={showDialog}
                onOpenChange={setShowDialog}
            />
        </>
    )
}
