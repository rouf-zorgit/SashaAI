import { Wallet } from "@/app/actions/wallet"

export interface Transaction {
    id: string
    amount: number
    type: 'income' | 'expense'
    wallet_id?: string | null
    date: string
}

/**
 * Calculate the available balance for a wallet
 * Takes into account current balance, monthly limits, and locked status
 */
export function calculateAvailableBalance(
    wallet: Wallet,
    currentMonthSpending: number = 0
): number {
    // If wallet is locked, available balance is 0
    if (wallet.is_locked) {
        return 0
    }

    let available = wallet.balance

    // If there's a monthly limit, factor it in
    if (wallet.monthly_limit) {
        const remainingLimit = wallet.monthly_limit - currentMonthSpending
        // Available is the minimum of current balance and remaining limit
        available = Math.min(wallet.balance, Math.max(0, remainingLimit))
    }

    return Math.max(0, available)
}

/**
 * Calculate total spending for a wallet in the current month
 */
export function calculateMonthlySpending(
    transactions: Transaction[],
    walletId: string
): number {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return transactions
        .filter(tx => {
            if (tx.wallet_id !== walletId) return false
            if (tx.type !== 'expense') return false

            const txDate = new Date(tx.date)
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
        })
        .reduce((sum, tx) => sum + tx.amount, 0)
}

/**
 * Check if a wallet has sufficient available balance for a transaction
 */
export function hasSufficientBalance(
    wallet: Wallet,
    amount: number,
    currentMonthSpending: number = 0
): boolean {
    const available = calculateAvailableBalance(wallet, currentMonthSpending)
    return available >= amount
}

/**
 * Get wallet utilization percentage (spending vs limit)
 */
export function getWalletUtilization(
    wallet: Wallet,
    currentMonthSpending: number
): number {
    if (!wallet.monthly_limit) return 0
    return Math.min(100, (currentMonthSpending / wallet.monthly_limit) * 100)
}

/**
 * Check if wallet is approaching its monthly limit (>80%)
 */
export function isApproachingLimit(
    wallet: Wallet,
    currentMonthSpending: number
): boolean {
    if (!wallet.monthly_limit) return false
    return getWalletUtilization(wallet, currentMonthSpending) >= 80
}

/**
 * Check if wallet has exceeded its monthly limit
 */
export function hasExceededLimit(
    wallet: Wallet,
    currentMonthSpending: number
): boolean {
    if (!wallet.monthly_limit) return false
    return currentMonthSpending > wallet.monthly_limit
}

/**
 * Calculate total balance across all wallets
 */
export function calculateTotalBalance(wallets: Wallet[]): number {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
}

/**
 * Calculate total available balance across all wallets
 */
export function calculateTotalAvailable(
    wallets: Wallet[],
    monthlySpendingByWallet: Record<string, number> = {}
): number {
    return wallets.reduce((sum, wallet) => {
        const spending = monthlySpendingByWallet[wallet.id] || 0
        return sum + calculateAvailableBalance(wallet, spending)
    }, 0)
}

/**
 * Get wallet status summary
 */
export function getWalletStatus(
    wallet: Wallet,
    currentMonthSpending: number
): {
    available: number
    utilization: number
    isLocked: boolean
    isApproachingLimit: boolean
    hasExceededLimit: boolean
    canSpend: boolean
} {
    const available = calculateAvailableBalance(wallet, currentMonthSpending)
    const utilization = getWalletUtilization(wallet, currentMonthSpending)

    return {
        available,
        utilization,
        isLocked: wallet.is_locked,
        isApproachingLimit: isApproachingLimit(wallet, currentMonthSpending),
        hasExceededLimit: hasExceededLimit(wallet, currentMonthSpending),
        canSpend: available > 0 && !wallet.is_locked
    }
}
