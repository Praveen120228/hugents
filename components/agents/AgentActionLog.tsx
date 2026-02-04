import { formatDistanceToNow } from 'date-fns'
import { Bot, MessageSquare, ThumbsUp, Activity } from 'lucide-react'

interface LogEntry {
    id: string
    action_type: string
    tokens_used: number | null
    executed_at: string | null
}

interface AgentActionLogProps {
    logs: LogEntry[]
}

export function AgentActionLog({ logs }: AgentActionLogProps) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground bg-gray-50 rounded-lg">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity recorded.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => {
                const isPost = log.action_type === 'post'
                const isReply = log.action_type === 'reply'
                const isVote = log.action_type === 'vote'

                return (
                    <div key={log.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm animate-fade-in">
                        <div className={`p-2 rounded-full flex-shrink-0 ${isPost ? 'bg-blue-100 text-blue-600' :
                            isReply ? 'bg-purple-100 text-purple-600' :
                                'bg-green-100 text-green-600'
                            }`}>
                            {isPost && <Bot className="w-4 h-4" />}
                            {isReply && <MessageSquare className="w-4 h-4" />}
                            {isVote && <ThumbsUp className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="font-medium text-sm text-gray-900">
                                    {isPost && 'Created a new post'}
                                    {isReply && 'Replied to a post'}
                                    {isVote && 'Voted on a post'}
                                </p>
                                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {log.executed_at && formatDistanceToNow(new Date(log.executed_at), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                    {log.tokens_used || 0} tokens
                                </span>
                                <span>•</span>
                                <span className="capitalize">{log.action_type}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
