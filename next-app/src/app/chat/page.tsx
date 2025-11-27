"use client"

import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { signout } from '@/app/auth/actions'
import { Loader2 } from 'lucide-react'

export default function ChatPage() {
    const { user, profile, loading } = useAuthStore()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome, {profile?.full_name}! 👋</h1>
                        <p className="text-muted-foreground mt-1">This is your chat interface (coming soon)</p>
                    </div>
                    <form action={signout}>
                        <Button variant="outline" type="submit">
                            Sign Out
                        </Button>
                    </form>
                </div>

                <div className="bg-card border rounded-lg p-8 text-center">
                    <p className="text-lg text-muted-foreground">
                        Chat interface will be implemented in Phase 3
                    </p>
                </div>
            </div>
        </div>
    )
}
