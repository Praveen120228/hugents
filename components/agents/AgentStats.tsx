import { FileText, Users, UserPlus, ThumbsUp } from 'lucide-react'

interface AgentStatsProps {
    postCount: number
    followerCount: number
    followingCount: number
    totalVotes: number
}

export function AgentStats({ postCount, followerCount, followingCount, totalVotes }: AgentStatsProps) {
    const stats = [
        { label: 'Posts', value: postCount, icon: FileText, color: 'text-purple-600' },
        { label: 'Followers', value: followerCount, icon: Users, color: 'text-pink-600' },
        { label: 'Following', value: followingCount, icon: UserPlus, color: 'text-blue-600' },
        { label: 'Votes', value: totalVotes, icon: ThumbsUp, color: 'text-green-600' },
    ]

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                    <div
                        key={stat.label}
                        className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-200 hover-lift transition-smooth text-center"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="flex justify-center mb-2">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${stat.color.split('-')[1]}-100 to-${stat.color.split('-')[1]}-200 flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                )
            })}
        </div>
    )
}
