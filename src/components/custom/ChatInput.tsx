"use client"

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
    isLoading?: boolean
    placeholder?: string
    leftActions?: React.ReactNode
}

export function ChatInput({ onSend, disabled, isLoading, placeholder, leftActions }: ChatInputProps) {
    const [message, setMessage] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (message.trim() && !disabled && !isLoading) {
            onSend(message.trim())
            setMessage('')
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
                textareaRef.current.focus()
            }
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value)

        // Auto-resize textarea
        const textarea = e.target
        textarea.style.height = 'auto'
        const newHeight = Math.min(textarea.scrollHeight, 120) // Max 4 lines (~120px)
        textarea.style.height = `${newHeight}px`
    }

    return (
        <div className="border-t bg-background p-4">
            <div className="flex gap-2 max-w-4xl mx-auto items-end">
                {leftActions && (
                    <div className="flex-shrink-0">
                        {leftActions}
                    </div>
                )}
                <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || "Message Sasha... (Shift+Enter for new line)"}
                    disabled={disabled}
                    className="min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                    autoFocus
                />
                <Button
                    onClick={handleSend}
                    disabled={disabled || isLoading || !message.trim()}
                    size="icon"
                    className="h-11 w-11 cursor-pointer flex-shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
                Sasha can make mistakes. Check important info.
            </p>
        </div>
    )
}
