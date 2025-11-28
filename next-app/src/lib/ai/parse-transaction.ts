import { Transaction } from '@/types/chat'

/**
 * Parse transaction from Claude's response
 * Format: [TRANSACTION: amount=50, category=groceries, type=expense, description=weekly shopping]
 */
export function parseTransaction(content: string): Transaction | null {
    const transactionRegex = /\[TRANSACTION:\s*amount=([\d.]+),\s*category=(\w+),\s*type=(income|expense),\s*description=([^\]]+)\]/i
    const match = content.match(transactionRegex)

    if (!match) return null

    const [, amount, category, type, description] = match

    return {
        amount: parseFloat(amount),
        category: category.toLowerCase(),
        type: type.toLowerCase() as 'income' | 'expense',
        description: description.trim()
    }
}

/**
 * Remove transaction tag from content for display
 */
export function removeTransactionTag(content: string): string {
    return content.replace(/\[TRANSACTION:[^\]]+\]/gi, '').trim()
}
