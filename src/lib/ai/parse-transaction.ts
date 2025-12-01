import { Transaction } from '@/types/chat'

/**
 * Extract all transactions from AI response
 * Format: [TRANSACTION: amount=50, category=groceries, type=expense, description=weekly shopping, wallet=Main Account]
 */
export function extractTransactions(aiResponse: string): any[] {
    console.log('🔍 Checking response for [TRANSACTION:...] markers');

    // Look for ALL [TRANSACTION: amount=X, category=Y, type=Z, description=W, wallet=V] markers
    const regex = /\[TRANSACTION:\s*amount=([0-9.]+),\s*category=([\w]+),\s*type=([\w]+),\s*description=([^\],]+)(?:,\s*wallet=([^\]]+))?\]/g;
    const matches = [...aiResponse.matchAll(regex)];

    if (matches.length === 0) {
        console.log('⚠️ No [TRANSACTION:...] markers found in response');
        return [];
    }

    console.log(`✅ Found ${matches.length} transaction marker(s)!`);

    return matches.map(match => ({
        amount: parseFloat(match[1]),
        category: match[2],
        type: match[3],
        description: match[4].trim(),
        walletHint: match[5]?.trim() || 'default', // Wallet name hint from AI
    }));
}

/**
 * Extract all transfers from AI response
 * Format: [TRANSFER: amount=500, from=Main Account, to=Savings, description=monthly savings]
 */
export function extractTransfers(aiResponse: string): any[] {
    console.log('🔍 Checking response for [TRANSFER:...] markers');

    // Look for [TRANSFER: amount=X, from=Y, to=Z, description=W] markers
    const regex = /\[TRANSFER:\s*amount=([0-9.]+),\s*from=([^\],]+),\s*to=([^\],]+)(?:,\s*description=([^\]]+))?\]/g;
    const matches = [...aiResponse.matchAll(regex)];

    if (matches.length === 0) {
        console.log('⚠️ No [TRANSFER:...] markers found in response');
        return [];
    }

    console.log(`✅ Found ${matches.length} transfer marker(s)!`);

    return matches.map(match => ({
        amount: parseFloat(match[1]),
        fromWalletHint: match[2].trim(),
        toWalletHint: match[3].trim(),
        description: match[4]?.trim() || 'Transfer',
    }));
}

/**
 * Legacy function - Parse single transaction from Claude's response
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
