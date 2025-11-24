// Exchange rate service using free API
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/BDT';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ExchangeRates {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}

let cachedRates: ExchangeRates | null = null;

export const SUPPORTED_CURRENCIES = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
];

export function getCurrencySymbol(code: string): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency?.symbol || code;
}

export async function getExchangeRates(): Promise<ExchangeRates> {
    // Check cache
    if (cachedRates && Date.now() - cachedRates.timestamp < CACHE_DURATION) {
        return cachedRates;
    }

    try {
        const response = await fetch(EXCHANGE_RATE_API);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }

        const data = await response.json();
        cachedRates = {
            base: data.base,
            rates: data.rates,
            timestamp: Date.now(),
        };

        return cachedRates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);

        // Return fallback rates if API fails
        if (cachedRates) {
            return cachedRates;
        }

        // Ultimate fallback - 1:1 rates
        return {
            base: 'BDT',
            rates: { BDT: 1, USD: 0.0091, EUR: 0.0084, GBP: 0.0072 },
            timestamp: Date.now(),
        };
    }
}

export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string = 'BDT'
): Promise<number> {
    if (fromCurrency === toCurrency) {
        return amount;
    }

    const rates = await getExchangeRates();

    // Convert from source currency to BDT (base)
    const amountInBDT = fromCurrency === 'BDT'
        ? amount
        : amount / (rates.rates[fromCurrency] || 1);

    // Convert from BDT to target currency
    const convertedAmount = toCurrency === 'BDT'
        ? amountInBDT
        : amountInBDT * (rates.rates[toCurrency] || 1);

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
}

export function formatCurrency(amount: number, currency: string): string {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2)}`;
}
