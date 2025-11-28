"use client"

import { Loader2 } from 'lucide-react'

export function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-secondary-foreground animate-spin" />
            </div>
            <div className="flex items-center gap-1 px-4 py-3 bg-muted rounded-lg">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    )
}
