import { z } from 'zod'

export const chatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1, 'Message content cannot be empty'),
})

export const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1, 'At least one message is required'),
    sessionId: z.string().optional(),
    mode: z.enum(['fast', 'deep']).optional().default('fast'),
})
