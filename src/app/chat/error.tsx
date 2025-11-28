'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ChatError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Chat Error:', error)
    }, [error])

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Chat System Error</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                We encountered an issue with the chat system. Please try refreshing or checking your connection.
            </p>
            <Button onClick={() => reset()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Chat
            </Button>
        </div>
    )
}
