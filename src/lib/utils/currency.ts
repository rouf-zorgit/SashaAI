export function formatCurrency(
    amount: number,
    currency: string = 'USD'
): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function formatCompactNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

export function formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%'
    return ((value / total) * 100).toFixed(1) + '%'
}
