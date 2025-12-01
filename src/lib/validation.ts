import { z } from 'zod'

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid ID format')

export const positiveNumberSchema = z.number().positive('Amount must be positive')

export const nonNegativeNumberSchema = z.number().min(0, 'Amount cannot be negative')

export const dateSchema = z.string().datetime('Invalid date format')

export const transactionTypeSchema = z.enum(['income', 'expense'])

export const categorySchema = z.enum([
    'groceries',
    'transport',
    'bills',
    'shopping',
    'dining',
    'health',
    'entertainment',
    'income',
    'other'
])

export const walletTypeSchema = z.enum(['cash', 'bank', 'card', 'mobile', 'other'])

export const currencySchema = z.enum(['USD', 'BDT', 'EUR', 'GBP'])

// Transaction validation schemas
export const createTransactionSchema = z.object({
    amount: positiveNumberSchema,
    category: categorySchema,
    type: transactionTypeSchema,
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    wallet_id: uuidSchema,
    date: dateSchema.optional(),
})

export const updateTransactionSchema = z.object({
    id: uuidSchema,
    amount: positiveNumberSchema.optional(),
    category: categorySchema.optional(),
    type: transactionTypeSchema.optional(),
    description: z.string().min(1).max(500).optional(),
    wallet_id: uuidSchema.optional(),
    date: dateSchema.optional(),
})

export const deleteTransactionSchema = z.object({
    id: uuidSchema,
})

// Wallet validation schemas
export const createWalletSchema = z.object({
    name: z.string().min(1, 'Wallet name is required').max(100, 'Name too long'),
    type: walletTypeSchema,
    currency: currencySchema,
    balance: nonNegativeNumberSchema,
    is_default: z.boolean().optional(),
})

export const updateWalletSchema = z.object({
    id: uuidSchema,
    name: z.string().min(1).max(100).optional(),
    type: walletTypeSchema.optional(),
    balance: nonNegativeNumberSchema.optional(),
    is_locked: z.boolean().optional(),
})

export const deleteWalletSchema = z.object({
    id: uuidSchema,
})

export const transferFundsSchema = z.object({
    from_wallet_id: uuidSchema,
    to_wallet_id: uuidSchema,
    amount: positiveNumberSchema,
    description: z.string().max(500).optional(),
}).refine(data => data.from_wallet_id !== data.to_wallet_id, {
    message: 'Cannot transfer to the same wallet',
    path: ['to_wallet_id']
})

// Profile validation schemas
export const updateProfileSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    currency: currencySchema.optional(),
    monthly_salary: nonNegativeNumberSchema.optional(),
    savings_goal: nonNegativeNumberSchema.optional(),
})

// Helper function to validate and return errors
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data)

    if (result.success) {
        return { success: true, data: result.data }
    }

    // Format Zod errors into a readable string
    const errorMessage = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    return { success: false, error: errorMessage }
}
