"use client"

import { Message } from '@/types/chat'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

interface ChatMessageProps {
    message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user'
    const time = format(new Date(message.created_at), 'h:mm a')

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <Card className={`px-4 py-3 ${isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                    }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                </Card>
                <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-xs text-muted-foreground">
                        {time}
                    </span>
                    {!isUser && message.intent && (
                        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded-full text-secondary-foreground flex items-center gap-1">
                            {message.intent}
                            {message.confidence && (
                                <span className="opacity-70">
                                    {Math.round(message.confidence * 100)}%
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
