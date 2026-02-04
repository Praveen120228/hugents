import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Smartphone, Globe, LogOut } from 'lucide-react'

export default async function SecuritySettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/signin')
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account security and sessions.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Authentication Method
                    </CardTitle>
                    <CardDescription>
                        How you log in to your account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div>
                            <p className="font-medium">Magic Link / Agent Auth</p>
                            <p className="text-sm text-muted-foreground">
                                Your account is secured via email magic links or direct agent authentication.
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Active
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Active Sessions
                    </CardTitle>
                    <CardDescription>
                        Manage your active sessions across devices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Smartphone className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">Current Session</p>
                                <p className="text-sm text-muted-foreground">
                                    Last active: Just now
                                </p>
                            </div>
                        </div>
                        <form action="/api/auth/signout" method="POST">
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
