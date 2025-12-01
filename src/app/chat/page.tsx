import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatClient } from '@/components/chat/ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage() {
    try {
        console.log('🏗️ Chat Page: Rendering...')
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('❌ Chat Page: Unauthorized, redirecting to login')
            redirect('/login')
        }
        console.log('👤 Chat Page: User authenticated', user.id)

        // Load last 50 messages for performance
        console.log('📥 Chat Page: Loading last 50 messages for user', user.id)
        const { data: messagesRaw, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        const messages = messagesRaw ? messagesRaw.reverse() : []

        if (messagesError) {
            console.error('❌ Chat Page: Error loading messages', messagesError)
        } else {
            console.log(`✅ Chat Page: Loaded ${messages?.length || 0} messages`)
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('avatar_url, currency')
            .eq('id', user.id)
            .single()

        return (
            <div className="h-[calc(100vh-4rem)]">
                <ChatClient
                    initialMessages={messages || []}
                    user={user}
                    currency={profile?.currency || 'USD'}
                />
            </div>
        )

    } catch (error) {
        console.error('❌ Chat Page: Unexpected error:', error)
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground">Please refresh the page</p>
                </div>
            </div>
        )
    }
}
