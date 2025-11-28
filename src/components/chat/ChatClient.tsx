"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/components/custom/ChatMessage'
import { ChatInput } from '@/components/custom/ChatInput'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { signout } from '@/app/auth/actions'
import { Message } from '@/types/chat'
import { User } from '@supabase/supabase-js'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatClientProps {
    initialMessages: Message[]
    user: User
    currency?: string
}

export function ChatClient({ initialMessages, user, currency = 'USD' }: ChatClientProps) {
    console.log('🏗️ ChatClient rendered')
    console.log('📥 Initial messages received:', initialMessages.length)

    // Initialize with messages from database
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        console.log('📜 Scrolled to bottom, message count:', messages.length)
    }, [messages])

    // Sync state with database messages on mount
    useEffect(() => {
        console.log('🔄 Syncing initial messages to state')
        setMessages(initialMessages)

        // Get latest session ID from messages
        if (initialMessages.length > 0) {
            const latestMessage = initialMessages[initialMessages.length - 1]
            // @ts-ignore
            if (latestMessage.session_id) {
                // @ts-ignore
                const sid = latestMessage.session_id
                console.log('🆔 Found existing session ID:', sid)
                setSessionId(sid)
            }
        }
    }, [initialMessages])

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return

        console.log('📤 Sending message:', content)

        // Add user message to UI immediately (optimistic update)
        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            // @ts-ignore
            session_id: sessionId || ''
        }

        setMessages(prev => {
            const newMessages = [...prev, tempUserMessage]
            console.log('➕ Added optimistic user message, count:', newMessages.length)
            return newMessages
        })
        setIsLoading(true)

        try {
            console.log('🌐 Calling Chat API...')
            // Send to API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content }
                    ],
                    mode: 'fast',
                    sessionId,
                }),
            })

            console.log('📡 API Response status:', response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('❌ API Error Data:', errorData)
                throw new Error(errorData.error || `HTTP Error ${response.status}`)
            }

            const data = await response.json()
            console.log('📦 API Response data received:', data)

            // Update session ID if new
            if (data.sessionId && !sessionId) {
                console.log('🆔 New session ID set:', data.sessionId)
                setSessionId(data.sessionId)
            }

            // Add assistant message to UI
            const assistantMessage: Message = {
                id: `temp-assistant-${Date.now()}`,
                user_id: user.id,
                role: 'assistant',
                content: data.message,
                created_at: new Date().toISOString(),
                // @ts-ignore
                session_id: data.sessionId || sessionId || ''
            }

            setMessages(prev => {
                const newMessages = [...prev, assistantMessage]
                console.log('➕ Added assistant message, count:', newMessages.length)
                return newMessages
            })

            // Check for transaction extraction
            // @ts-ignore
            if (data.transaction) {
                console.log('💰 Transaction detected:', data.transaction)
                toast.success('Transaction logged!')
            }

        } catch (error) {
            console.error('❌ Error sending message:', error)
            toast.error('Failed to send message. Please try again.')

            // Remove optimistic user message on error
            setMessages(prev => {
                console.log('➖ Removing failed optimistic message')
                return prev.filter(m => m.id !== tempUserMessage.id)
            })
        } finally {
            setIsLoading(false)
            console.log('🏁 Message processing complete')
        }
    }

    return (
        <div className="flex flex-col h-full max-h-full overflow-hidden bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                            <img
                                src="/sasha.jpg"
                                alt="Sasha"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Sasha</h1>
                            <p className="text-xs text-muted-foreground">Your AI Finance Assistant</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <form action={signout}>
                            <Button variant="ghost" size="sm" type="submit" className="cursor-pointer">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 max-w-4xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <h2 className="text-2xl font-bold mb-2">Welcome to Sasha! 👋</h2>
                            <p className="text-muted-foreground max-w-md">
                                I'm your AI finance assistant. Tell me about your expenses and income,
                                and I'll help you track them automatically!
                            </p>
                            <div className="mt-6 text-sm text-muted-foreground">
                                <p className="mb-2">Try saying:</p>
                                <ul className="space-y-1">
                                    <li>"I spent $50 on groceries today"</li>
                                    <li>"Got paid $3000 this month"</li>
                                    <li>"Bought coffee for $5.50"</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <ChatMessage
                                key={message.id}
                                message={message}
                            />
                        ))
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground p-4">
                            <div className="animate-pulse">Sasha is typing...</div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex-shrink-0">
                <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
        </div>
    )
}
