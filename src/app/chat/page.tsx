"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useChatStore } from '@/store/chat-store'
import { createClient } from '@/lib/supabase/client'
import { getMessages, saveMessage } from '@/lib/db/messages'
import { saveTransaction } from '@/lib/db/transactions'
import { parseTransaction, removeTransactionTag } from '@/lib/ai/parse-transaction'
import { ChatMessage } from '@/components/custom/ChatMessage'
import { ChatInput } from '@/components/custom/ChatInput'
import { TypingIndicator } from '@/components/custom/TypingIndicator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Brain, Zap, Loader2, LogOut, MessageSquare } from 'lucide-react'
import { signout } from '@/app/auth/actions'
import { toast } from 'sonner'
import type { Message } from '@/types/chat'

export default function ChatPage() {
    const { user, profile, loading: authLoading } = useAuthStore()
    const {
        messages,
        isLoading,
        streamingMessage,
        setMessages,
        addMessage,
        setIsLoading,
        setStreamingMessage,
        appendToStreamingMessage,
        clearStreamingMessage
    } = useChatStore()

    const [initialLoading, setInitialLoading] = useState(true)
    const [mode, setMode] = useState<'fast' | 'deep'>('fast')
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Load messages on mount
    useEffect(() => {
        if (user) {
            loadMessages()
        }
    }, [user])

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom()
    }, [messages, streamingMessage])

    const loadMessages = async () => {
        if (!user) return

        setInitialLoading(true)
        const loadedMessages = await getMessages(supabase, user.id)
        setMessages(loadedMessages)
        setInitialLoading(false)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleSendMessage = async (content: string) => {
        if (!user || !content.trim()) return

        setIsLoading(true)
        clearStreamingMessage()

        try {
            // Save user message to database
            const userMessage = await saveMessage(supabase, user.id, 'user', content)
            if (userMessage) {
                addMessage(userMessage)
            }

            // Prepare messages for API
            const conversationHistory = messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }))

            conversationHistory.push({
                role: 'user',
                content: content
            })

            // Call streaming API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: conversationHistory,
                    mode // Pass selected mode
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to get response from Sasha')
            }

            // Handle streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullResponse = ''

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6))

                            if (data.text) {
                                fullResponse += data.text
                                appendToStreamingMessage(data.text)
                            }

                            if (data.done) {
                                // Parse transaction from response
                                const transaction = parseTransaction(fullResponse)

                                // Remove transaction tag from display
                                const cleanContent = removeTransactionTag(fullResponse)

                                // Save assistant message to database
                                const assistantMessage = await saveMessage(
                                    supabase,
                                    user.id,
                                    'assistant',
                                    cleanContent
                                )

                                if (assistantMessage) {
                                    addMessage(assistantMessage)

                                    // Save transaction if detected
                                    if (transaction) {
                                        try {
                                            await saveTransaction(supabase, user.id, {
                                                ...transaction,
                                                message_id: assistantMessage.id
                                            })

                                            // Show success toast
                                            const emoji = transaction.type === 'income' ? '💰' : '💸'
                                            toast.success(
                                                `${emoji} Logged $${transaction.amount} for ${transaction.category}`,
                                                {
                                                    description: transaction.description
                                                }
                                            )
                                        } catch (error) {
                                            console.error('Error saving transaction:', error)
                                            toast.error('Failed to save transaction')
                                        }
                                    }
                                }

                                clearStreamingMessage()
                            }

                            if (data.error) {
                                console.error('Streaming error:', data.error)
                                toast.error(data.error)
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Failed to send message. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading || initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Sasha</h1>
                            <p className="text-xs text-muted-foreground">Your AI Finance Assistant</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="mode-toggle" className="text-xs font-medium flex items-center gap-1">
                                {mode === 'fast' ? <Zap className="h-3 w-3 text-yellow-500" /> : <Brain className="h-3 w-3 text-purple-500" />}
                                {mode === 'fast' ? 'Fast' : 'Deep'}
                            </Label>
                            <Switch
                                id="mode-toggle"
                                checked={mode === 'deep'}
                                onCheckedChange={(checked) => setMode(checked ? 'deep' : 'fast')}
                            />
                        </div>
                        <form action={signout}>
                            <Button variant="ghost" size="sm" type="submit">
                                <LogOut className="h-4 w-4 mr-2" />
                                Sign Out
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="max-w-4xl mx-auto">
                    {messages.length === 0 && !streamingMessage && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
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
                    )}

                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}

                    {streamingMessage && (
                        <ChatMessage
                            message={{
                                id: 'streaming',
                                user_id: user?.id || '',
                                role: 'assistant',
                                content: removeTransactionTag(streamingMessage),
                                created_at: new Date().toISOString()
                            }}
                        />
                    )}

                    {isLoading && !streamingMessage && <TypingIndicator />}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
    )
}
