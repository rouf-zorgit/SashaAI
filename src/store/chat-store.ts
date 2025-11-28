import { create } from 'zustand'
import { Message } from '@/types/chat'

interface ChatState {
    messages: Message[]
    isLoading: boolean
    streamingMessage: string

    setMessages: (messages: Message[]) => void
    addMessage: (message: Message) => void
    setIsLoading: (loading: boolean) => void
    setStreamingMessage: (content: string) => void
    appendToStreamingMessage: (chunk: string) => void
    clearStreamingMessage: () => void
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    streamingMessage: '',

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    setIsLoading: (loading) => set({ isLoading: loading }),

    setStreamingMessage: (content) => set({ streamingMessage: content }),

    appendToStreamingMessage: (chunk) => set((state) => ({
        streamingMessage: state.streamingMessage + chunk
    })),

    clearStreamingMessage: () => set({ streamingMessage: '' }),
}))
