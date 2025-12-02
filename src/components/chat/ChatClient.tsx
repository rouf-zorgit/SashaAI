"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChatMessage } from '@/components/custom/ChatMessage'
import { ChatInput } from '@/components/custom/ChatInput'
import { ReceiptUploadDialog } from '@/components/receipts/ReceiptUploadDialog'
import { Button } from '@/components/ui/button'
import { LogOut, Receipt, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { signout } from '@/app/auth/actions'
import { Message } from '@/types/chat'
import { User } from '@supabase/supabase-js'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getOlderMessages } from '@/app/actions/chat'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ChatClientProps {
    initialMessages: Message[]
    user: User
    currency?: string
}

export function ChatClient({ initialMessages, user, currency = 'USD' }: ChatClientProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Pagination state
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(initialMessages.length >= 50)

    // Error handling state
    const [errorState, setErrorState] = useState<{ msg: string, type: string, retryContent?: string } | null>(null)
    const [rateLimitCountdown, setRateLimitCountdown] = useState(0)

    // Scroll to bottom when messages change (only if not loading more)
    useEffect(() => {
        if (!loadingMore) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }
    }, [messages, loadingMore])

    // Initial scroll
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' })
        }
    }, [])

    // Sync state
    useEffect(() => {
        setMessages(initialMessages)
        setHasMore(initialMessages.length >= 50)
        if (initialMessages.length > 0) {
            const latest = initialMessages[initialMessages.length - 1]
            // @ts-ignore
            if (latest.session_id) setSessionId(latest.session_id)
        }
    }, [initialMessages])

    // Rate limit countdown
    useEffect(() => {
        if (rateLimitCountdown > 0) {
            const timer = setTimeout(() => setRateLimitCountdown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [rateLimitCountdown])

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMore || messages.length === 0) return
        setLoadingMore(true)
        try {
            const oldestMessage = messages[0]
            const olderMessages = await getOlderMessages(user.id, oldestMessage.created_at)

            if (olderMessages.length < 50) {
                setHasMore(false)
            }

            if (olderMessages.length > 0) {
                setMessages(prev => [...olderMessages, ...prev])
            }
        } catch (error) {
            console.error('Failed to load older messages:', error)
            toast.error('Could not load older messages')
        } finally {
            setLoadingMore(false)
        }
    }

    const handleSendMessage = async (content: string) => {
        if (!content.trim() || rateLimitCountdown > 0) return

        setErrorState(null) // Clear previous errors

        // Ensure we have a session ID
        let currentSessionId = sessionId
        if (!currentSessionId) {
            currentSessionId = crypto.randomUUID()
            setSessionId(currentSessionId)
        }

        // Optimistic update
        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            user_id: user.id,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
            // @ts-ignore
            session_id: currentSessionId
        }

        setMessages(prev => [...prev, tempUserMessage])
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Include cookies for auth
                body: JSON.stringify({
                    message: content,
                    sessionId: currentSessionId,
                }),
            })

            if (!response.ok) {
                // Handle HTTP errors
                const status = response.status
                const responseText = await response.text()
                console.error('Chat API Error:', status, response.statusText, responseText)

                let errorMsg = `Failed to send message (${status})`
                let type = 'network'

                if (status === 429) {
                    errorMsg = 'Too many requests. Please wait 60s.'
                    type = 'rate_limit'
                    setRateLimitCountdown(60)
                } else if (status >= 500) {
                    errorMsg = 'Sasha is temporarily unavailable.'
                    type = 'api_error'
                } else {
                    // Try to parse error message from server
                    try {
                        const json = JSON.parse(responseText)
                        if (json.error) errorMsg = json.error
                    } catch (e) {
                        // Use default
                    }
                }

                throw new Error(JSON.stringify({ msg: errorMsg, type }))
            }

            // Placeholder assistant message
            const assistantMessageId = `temp-assistant-${Date.now()}`
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                user_id: user.id,
                role: 'assistant',
                content: '',
                created_at: new Date().toISOString(),
                // @ts-ignore
                session_id: sessionId || ''
            }])

            // Parse JSON response
            const data = await response.json()

            if (data.error) {
                throw new Error(JSON.stringify({ msg: data.error, type: 'api_error' }))
            }

            // Update assistant message with actual content
            setMessages(prev => prev.map(m =>
                m.id === assistantMessageId ? { ...m, content: data.reply } : m
            ))

            // Handle transactions if present
            if (data.transactions?.length > 0) {
                const symbol = currency === 'BDT' ? '৳' : currency === 'USD' ? '$' : currency
                const total = data.transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
                toast.success(`${data.transactions.length} transactions saved! Total: ${symbol}${total}`)

                // Refresh history/balance if needed
                // router.refresh() 
            }

        } catch (error: any) {
            console.error('Send error:', error)

            let errorData = { msg: 'Failed to send message', type: 'unknown' }
            try {
                errorData = JSON.parse(error.message)
            } catch (e) {
                // Keep default
            }

            setErrorState({ ...errorData, retryContent: content })

            // Remove the optimistic user message and the placeholder assistant message
            setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id && !m.id.startsWith('temp-assistant')))

            if (errorData.type === 'rate_limit') {
                setRateLimitCountdown(60)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleRetry = () => {
        if (errorState?.retryContent) {
            handleSendMessage(errorState.retryContent)
        }
    }

    return (
        <div className="flex flex-col h-full max-h-full overflow-hidden bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
                            <img src="/sasha.jpg" alt="Sasha" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Sasha</h1>
                            <p className="text-xs text-muted-foreground">Your AI Finance Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ReceiptUploadDialog
                            trigger={
                                <Button variant="outline" size="sm" className="cursor-pointer">
                                    <Receipt className="h-4 w-4 mr-2" />
                                    Upload Receipt
                                </Button>
                            }
                            onSuccess={() => toast.success('Receipt uploaded!')}
                        />
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
                    {hasMore && (
                        <div className="flex justify-center mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={loadMoreMessages}
                                disabled={loadingMore}
                                className="text-muted-foreground"
                            >
                                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                Load older messages
                            </Button>
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <h2 className="text-2xl font-bold mb-2">Welcome to Sasha! 👋</h2>
                            <p className="text-muted-foreground max-w-md">I'm your AI finance assistant. Tell me about your expenses!</p>
                        </div>
                    ) : (
                        messages.map((message) => <ChatMessage key={message.id} message={message} />)
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground p-4">
                            <div className="animate-pulse">Sasha is typing...</div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Error Alert */}
            {errorState && (
                <div className="p-4 max-w-4xl mx-auto pb-0">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="flex items-center justify-between">
                            <span>{errorState.msg}</span>
                            {errorState.type !== 'rate_limit' && (
                                <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4 bg-background text-foreground hover:bg-accent">
                                    Retry
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0">
                <ChatInput
                    onSend={handleSendMessage}
                    disabled={isLoading || rateLimitCountdown > 0}
                    placeholder={rateLimitCountdown > 0 ? `Please wait ${rateLimitCountdown}s...` : "Type a message..."}
                />
            </div>
        </div>
    )
}
