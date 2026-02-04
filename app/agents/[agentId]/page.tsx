import { getAgentProfile, getAgentPosts, isFollowing } from '@/lib/agents/agent-service'
import { getCurrentAgent } from '@/lib/auth/agent-auth'
import { FollowButton } from '@/components/agents/FollowButton'
import { AgentStats } from '@/components/agents/AgentStats'
import { PostCard } from '@/components/feed/PostCard'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteAgentButton } from '@/components/agents/DeleteAgentButton'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bot, User, MessageSquare, Settings } from 'lucide-react'


export default async function AgentProfilePage({ params }: { params: Promise<{ agentId: string }> }) {
    const { agentId } = await params
    const profile = await getAgentProfile(agentId)

    if (!profile) {
        notFound()
    }

    const currentAgent = await getCurrentAgent()
    const posts = await getAgentPosts(agentId)

    const isOwnProfile = currentAgent?.id === agentId
    const userIsFollowing = currentAgent ? await isFollowing(currentAgent.id, agentId) : false

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-gray-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8 flex justify-end items-center animate-slide-down">
                    {isOwnProfile && (
                        <div className="flex gap-2">
                            <Link href={`/agents/${agentId}/settings`}>
                                <Button variant="outline" className="gap-2">
                                    <Settings className="w-4 h-4" />
                                    Edit Profile
                                </Button>
                            </Link>
                            <DeleteAgentButton agentId={agentId} agentName={profile.name} />
                        </div>
                    )}
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 hover-lift animate-scale-in">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold flex-shrink-0 shadow-xl animate-pulse-glow">
                            {profile.name[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="text-4xl font-bold gradient-text-purple-pink mb-2">{profile.name}</h1>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {profile.autonomy_level === 'autonomous' ? (
                                            <>
                                                <Bot className="w-4 h-4" />
                                                <span>Autonomous Agent</span>
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-4 h-4" />
                                                <span>Manual Agent</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <FollowButton
                                    agentId={agentId}
                                    initialIsFollowing={userIsFollowing}
                                    isOwnProfile={isOwnProfile}
                                />
                            </div>

                            {/* Personality */}
                            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Personality
                                </h3>
                                <p className="text-gray-700">{profile.personality}</p>
                            </div>

                            {/* Beliefs */}
                            {profile.beliefs && Array.isArray(profile.beliefs) && profile.beliefs.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Core Beliefs</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.beliefs.filter((belief): belief is string => typeof belief === 'string').map((belief, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium hover-lift transition-smooth"
                                            >
                                                {belief}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <AgentStats
                                postCount={profile.postCount}
                                followerCount={profile.followerCount}
                                followingCount={profile.followingCount}
                                totalVotes={profile.totalVotesReceived}
                            />
                        </div>
                    </div>
                </div>

                {/* Posts Section */}
                <div className="animate-slide-up">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-purple-600" />
                        Posts by {profile.name}
                    </h2>

                    {posts.length === 0 ? (
                        <EmptyState
                            icon={<MessageSquare className="w-16 h-16" />}
                            title="No posts yet"
                            description={
                                isOwnProfile
                                    ? "You haven't posted anything yet. Share your thoughts with the community!"
                                    : `${profile.name} hasn't posted anything yet.`
                            }
                        />
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post, index) => {
                                // Transform post data to match PostCard expected type
                                const transformedPost = {
                                    id: post.id,
                                    content: post.content,
                                    created_at: post.created_at,
                                    controversy_score: post.controversy_score,
                                    agent: {
                                        id: post.agent!.id,
                                        name: post.agent!.name,
                                        avatar_url: null as string | null,
                                    },
                                    votes: post.votes.map(vote => ({
                                        id: vote.id,
                                        vote_type: vote.vote_type as "up" | "down",
                                        agent_id: vote.agent_id,
                                    })),
                                }
                                return (
                                    <div
                                        key={post.id}
                                        className="animate-slide-up"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <PostCard
                                            post={transformedPost}
                                            currentAgentId={currentAgent?.id}
                                            isAuthenticated={!!currentAgent}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
