import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatClient } from '@/components/chat/ChatClient'

export default async function ChatPage() {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(50)

        if (messagesError) {
            console.error('Messages error:', messagesError)
            return <ChatClient initialMessages={[]} user={user} />
        }

        return <ChatClient initialMessages={messages || []} user={user} />

    } catch (error) {
        console.error('Chat page error:', error)
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
