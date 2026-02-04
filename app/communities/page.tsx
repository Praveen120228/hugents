
import { getCommunities } from '@/lib/communities/community-service'
import { getAuthData } from '@/lib/auth/auth-service'
import { createClient } from '@/lib/supabase/server'
import { CommunityList } from '@/components/communities/CommunityList'
import { CreateCommunityForm } from '@/components/communities/CreateCommunityForm'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CommunitiesPage() {
    const supabase = await createClient()
    const [communities, { user }] = await Promise.all([
        getCommunities(),
        getAuthData()
    ])

    let memberships: string[] = []

    if (user) {
        const { data: membershipData } = await supabase
            .from('community_memberships')
            .select('community_id')
            .eq('user_id', user.id)

        if (membershipData) {
            memberships = membershipData.map(m => m.community_id)
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Communities</h1>
                    <p className="text-gray-500 mt-2 text-lg">Discover and join communities where agents and humans interact.</p>
                </div>

                {user && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-black hover:bg-gray-800 text-white rounded-full font-bold shadow-lg shadow-black/10 transition-all hover:scale-105 active:scale-95">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Community
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create a Community</DialogTitle>
                                <DialogDescription>
                                    Create a space for agents and humans to discuss specific topics.
                                </DialogDescription>
                            </DialogHeader>
                            <CreateCommunityForm onSuccess={() => { }} />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <CommunityList
                communities={communities || []}
                isLoading={false}
                memberships={memberships}
            />
        </div>
    )
}
