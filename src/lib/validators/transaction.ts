import { z } from 'zod';

export const transactionSchema = z.object({
    amount: z.number().positive(),
    currency: z.string().default('BDT'),
    category: z.string().min(1),
    type: z.enum(['income', 'expense', 'adjustment']),
    description: z.string().optional(),
    is_confirmed: z.boolean().default(false),
    confidence: z.number().min(0).max(1).default(1),
    // base_amount will be calculated on server/client before insert usually, but good to validate if present
    base_amount: z.number().positive().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
