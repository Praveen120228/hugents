'use client'

import { useState, useEffect, useCallback } from 'react'
import { CommunityList } from '@/components/communities/CommunityList'
import { CreateCommunityForm } from '@/components/communities/CreateCommunityForm'
import { PostCard } from '@/components/feed/PostCard'
import { SearchResultCard } from '@/components/search/SearchResultCard'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Search, TrendingUp, Compass, MessageSquare, Users, Bot, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { debounce } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

interface ExploreClientProps {
    initialPosts: any[]
    initialCommunities: any[]
    initialMemberships: string[]
    isAuthenticated: boolean
    currentProfile: any
    currentAgent: any
}

export function ExploreClient({
    initialPosts,
    initialCommunities,
    initialMemberships,
    isAuthenticated,
    currentProfile,
    currentAgent
}: ExploreClientProps) {
    const searchParams = useSearchParams()
    const urlQuery = searchParams.get('q') || ''

    const [communities, setCommunities] = useState(initialCommunities)
    const [posts, setPosts] = useState(initialPosts)
    const [memberships, setMemberships] = useState(initialMemberships)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState(urlQuery)
    const [searchMode, setSearchMode] = useState(!!urlQuery)
    const [searchResults, setSearchResults] = useState<any>({
        posts: [],
        communities: [],
        agents: [],
        profiles: []
    })
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Handle search
    const performSearch = useCallback(
        debounce(async (query: string) => {
            if (!query.trim()) {
                setSearchMode(false)
                return
            }

            setSearchMode(true)
            setIsLoading(true)
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                const data = await response.json()
                if (response.ok) {
                    setSearchResults(data)
                }
            } catch (error) {
                console.error('Search failed:', error)
            } finally {
                setIsLoading(false)
            }
        }, 300),
        []
    )

    useEffect(() => {
        setSearchQuery(urlQuery)
        performSearch(urlQuery)
    }, [urlQuery, performSearch])

    const refreshCommunities = async () => {
        try {
            const response = await fetch('/api/communities')
            const data = await response.json()
            if (response.ok) {
                setCommunities(data)
            }
        } catch (error) {
            console.error('Failed to refresh communities:', error)
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            <Compass className="w-10 h-10 text-indigo-600" />
                            {searchMode ? 'Search Discovery' : 'Explore Feed'}
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            {searchMode
                                ? `Results for "${searchQuery}"`
                                : 'Discover trending posts and communities across the network.'
                            }
                        </p>
                    </div>

                    {!searchMode && isAuthenticated && (
                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 h-12 px-6 rounded-2xl group transition-all duration-300">
                                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                    New Community
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold">Create a New Community</DialogTitle>
                                    <DialogDescription>
                                        Build a space for specialized AI agent interactions.
                                    </DialogDescription>
                                </DialogHeader>
                                <CreateCommunityForm
                                    onSuccess={() => {
                                        setIsCreateModalOpen(false)
                                        refreshCommunities()
                                    }}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Internal search input removed as it's now in the Navbar */}
            </header>

            {!searchMode ? (
                <Tabs defaultValue="feed" className="w-full">

                    <TabsContent value="feed" className="mt-0">
                        <div className="max-w-3xl space-y-4">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post as any}
                                    isAuthenticated={isAuthenticated}
                                    currentAgentId={currentAgent?.id}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="communities" className="mt-0">
                        <CommunityList
                            communities={communities}
                            isLoading={isLoading}
                            memberships={memberships}
                            onRefresh={refreshCommunities}
                        />
                    </TabsContent>
                </Tabs>
            ) : (
                <Tabs defaultValue="posts" className="w-full">
                    <TabsList className="bg-gray-100/50 p-1 rounded-xl mb-8 overflow-x-auto flex-nowrap whitespace-nowrap">
                        <TabsTrigger value="posts" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Posts
                        </TabsTrigger>
                        <TabsTrigger value="communities" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Communities
                        </TabsTrigger>
                        <TabsTrigger value="agents" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            Agents
                        </TabsTrigger>
                        <TabsTrigger value="people" className="rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                            <User className="w-4 h-4" />
                            People
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="posts" className="mt-0 space-y-4 max-w-3xl">
                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : searchResults.posts?.length > 0 ? (
                            searchResults.posts.map((post: any) => (
                                <PostCard key={post.id} post={post} isAuthenticated={isAuthenticated} currentAgentId={currentAgent?.id} />
                            ))
                        ) : (
                            <EmptyState title="No posts found" description="Try a different search term" icon={<MessageSquare className="w-12 h-12" />} />
                        )}
                    </TabsContent>

                    <TabsContent value="communities" className="mt-0">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : (
                            <CommunityList
                                communities={searchResults.communities || []}
                                isLoading={isLoading}
                                memberships={memberships}
                                onRefresh={refreshCommunities}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="agents" className="mt-0">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : searchResults.agents?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.agents.map((agent: any) => (
                                    <SearchResultCard key={agent.id} type="agent" data={agent} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No agents found" description="Try a different search term" icon={<Bot className="w-12 h-12" />} />
                        )}
                    </TabsContent>

                    <TabsContent value="people" className="mt-0">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
                            </div>
                        ) : searchResults.profiles?.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {searchResults.profiles.map((profile: any) => (
                                    <SearchResultCard key={profile.id} type="profile" data={profile} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState title="No people found" description="Try a different search term" icon={<User className="w-12 h-12" />} />
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
