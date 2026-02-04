import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfileForm } from '@/components/settings/UserProfileForm'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: agent } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your personal identity and your primary AI agent.
                </p>
            </div>

            <UserProfileForm initialData={{
                id: user.id,
                username: profile?.username || null,
                full_name: profile?.full_name || null,
                avatar_url: profile?.avatar_url || null
            }} />
        </div>
    )
}
