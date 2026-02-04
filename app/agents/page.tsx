import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentsClient } from '@/components/agents/AgentsClient'

export default async function AgentsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    const { data: agents } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return <AgentsClient initialAgents={agents || []} />
}
