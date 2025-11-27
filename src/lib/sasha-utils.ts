// ============================================
// SENTIMENT ANALYSIS & EMOTION DETECTION
// ============================================

export interface EmotionDetection {
    emotion: 'guilt' | 'anxiety' | 'excitement' | 'defensive' | 'confusion' | 'regret' | 'neutral';
    intensity: number; // 0-1
    keywords: string[];
}

const emotionKeywords = {
    guilt: ['shouldn\'t have', 'regret', 'mistake', 'bad decision', 'feel bad', 'guilty', 'wrong'],
    anxiety: ['worried', 'stressed', 'scared', 'nervous', 'concerned', 'anxious', 'afraid'],
    excitement: ['great', 'awesome', 'happy', 'excited', 'finally', 'yes!', 'amazing', 'love'],
    defensive: ['but', 'however', 'actually', 'you don\'t understand', 'not fair', 'why'],
    confusion: ['don\'t know', 'confused', 'how do i', 'what should', 'help', 'unclear', '?'],
    regret: ['wish i hadn\'t', 'if only', 'should have', 'too late', 'missed']
};

export function detectEmotion(message: string): EmotionDetection {
    const lowerMessage = message.toLowerCase();
    let detectedEmotion: EmotionDetection['emotion'] = 'neutral';
    let maxScore = 0;
    let matchedKeywords: string[] = [];

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
        const score = matches.length;

        if (score > maxScore) {
            maxScore = score;
            detectedEmotion = emotion as EmotionDetection['emotion'];
            matchedKeywords = matches;
        }
    }

    const intensity = Math.min(maxScore / 3, 1);

    return {
        emotion: detectedEmotion,
        intensity,
        keywords: matchedKeywords
    };
}

export function adjustSarcasmLevel(
    baseLevel: number,
    emotion: EmotionDetection
): number {
    const adjustments = {
        guilt: -0.5,
        anxiety: -0.5,
        excitement: 0.2,
        defensive: 0.3,
        confusion: -0.3,
        regret: -0.4,
        neutral: 0
    };

    const adjustment = adjustments[emotion.emotion] * emotion.intensity;
    return Math.max(0, Math.min(1, baseLevel + adjustment));
}

// ============================================
// PATTERN DETECTION
// ============================================

export interface Transaction {
    id: string;
    amount: number;
    category: string;
    merchant_name?: string;
    type: 'income' | 'expense';
    created_at: string;
}

export interface DetectedPattern {
    type: 'weekend_spike' | 'payday_splurge' | 'stress_shopping' | 'recurring_bill' | 'impulse_category';
    trigger_day?: string;
    trigger_category?: string;
    avg_amount: number;
    frequency: string;
    confidence: number;
    occurrences: Transaction[];
}

export function detectWeekendSpike(transactions: Transaction[]): DetectedPattern | null {
    const weekendTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    });

    if (weekendTransactions.length < 5) return null;

    const avgWeekend = weekendTransactions.reduce((sum, t) => sum + t.amount, 0) / weekendTransactions.length;
    const weekdayTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        const day = date.getDay();
        return day !== 0 && day !== 6;
    });
    const avgWeekday = weekdayTransactions.length > 0
        ? weekdayTransactions.reduce((sum, t) => sum + t.amount, 0) / weekdayTransactions.length
        : 0;

    // Weekend spike if weekend spending is 50% higher
    if (avgWeekend > avgWeekday * 1.5) {
        return {
            type: 'weekend_spike',
            trigger_day: 'Weekend',
            avg_amount: avgWeekend,
            frequency: 'weekly',
            confidence: 0.8,
            occurrences: weekendTransactions
        };
    }

    return null;
}

export function detectPaydaySpurge(
    transactions: Transaction[],
    salaryDay: number
): DetectedPattern | null {
    if (!salaryDay) return null;

    const paydayTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        const day = date.getDate();
        return day === salaryDay || day === salaryDay + 1 || day === salaryDay + 2;
    });

    if (paydayTransactions.length < 5) return null;

    const avgPayday = paydayTransactions.reduce((sum, t) => sum + t.amount, 0) / paydayTransactions.length;
    const otherTransactions = transactions.filter(t => {
        const date = new Date(t.created_at);
        const day = date.getDate();
        return day < salaryDay - 2 || day > salaryDay + 2;
    });
    const avgOther = otherTransactions.length > 0
        ? otherTransactions.reduce((sum, t) => sum + t.amount, 0) / otherTransactions.length
        : 0;

    // Payday splurge if payday spending is 2x higher
    if (avgPayday > avgOther * 2) {
        return {
            type: 'payday_splurge',
            trigger_day: `Day ${salaryDay}`,
            avg_amount: avgPayday,
            frequency: 'monthly',
            confidence: 0.85,
            occurrences: paydayTransactions
        };
    }

    return null;
}

export function detectImpulseCategory(transactions: Transaction[]): DetectedPattern[] {
    const categoryGroups: { [key: string]: Transaction[] } = {};

    transactions.forEach(t => {
        if (!categoryGroups[t.category]) {
            categoryGroups[t.category] = [];
        }
        categoryGroups[t.category].push(t);
    });

    const patterns: DetectedPattern[] = [];

    for (const [category, txns] of Object.entries(categoryGroups)) {
        if (txns.length >= 10) {
            const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;
            const totalAmount = txns.reduce((sum, t) => sum + t.amount, 0);

            // High frequency + high total = impulse category
            if (txns.length > 15 || totalAmount > 10000) {
                patterns.push({
                    type: 'impulse_category',
                    trigger_category: category,
                    avg_amount: avgAmount,
                    frequency: `${txns.length} times`,
                    confidence: Math.min(txns.length / 20, 0.9),
                    occurrences: txns
                });
            }
        }
    }

    return patterns;
}

export function detectAllPatterns(
    transactions: Transaction[],
    salaryDay?: number
): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Weekend spike
    const weekendPattern = detectWeekendSpike(transactions);
    if (weekendPattern) patterns.push(weekendPattern);

    // Payday splurge
    if (salaryDay) {
        const paydayPattern = detectPaydaySpurge(transactions, salaryDay);
        if (paydayPattern) patterns.push(paydayPattern);
    }

    // Impulse categories
    const impulsePatterns = detectImpulseCategory(transactions);
    patterns.push(...impulsePatterns);

    return patterns;
}

// ============================================
// CASH FLOW PREDICTION
// ============================================

export interface CashFlowPredictionResult {
    date: Date;
    predicted_balance: number;
    predicted_income: number;
    predicted_expenses: number;
    warning_level: 'safe' | 'caution' | 'danger' | 'crisis';
}

export function predictCashFlow(
    currentBalance: number,
    transactions: Transaction[],
    recurringBills: Array<{ amount: number; due_day: number }>,
    salaryDay: number | undefined,
    monthlyIncome: number | undefined,
    daysAhead: number = 30
): CashFlowPredictionResult[] {
    // Calculate average daily spending
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const avgDailySpending = expenseTransactions.length > 0
        ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0) / 30
        : 0;

    const predictions: CashFlowPredictionResult[] = [];
    let balance = currentBalance;

    for (let day = 1; day <= daysAhead; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        const dayOfMonth = date.getDate();

        // Subtract daily spending
        balance -= avgDailySpending;

        // Subtract bills due on this day
        const billsDue = recurringBills.filter(b => b.due_day === dayOfMonth);
        const billsTotal = billsDue.reduce((sum, b) => sum + b.amount, 0);
        balance -= billsTotal;

        // Add salary if payday
        let incomeToday = 0;
        if (salaryDay && dayOfMonth === salaryDay && monthlyIncome) {
            balance += monthlyIncome;
            incomeToday = monthlyIncome;
        }

        // Determine warning level
        let warningLevel: CashFlowPredictionResult['warning_level'] = 'safe';
        if (balance < 0) warningLevel = 'crisis';
        else if (balance < 5000) warningLevel = 'danger';
        else if (balance < 10000) warningLevel = 'caution';

        predictions.push({
            date,
            predicted_balance: balance,
            predicted_income: incomeToday,
            predicted_expenses: avgDailySpending + billsTotal,
            warning_level: warningLevel
        });
    }

    return predictions;
}

// ============================================
// STREAK CALCULATION
// ============================================

export function calculateBudgetStreak(
    transactions: Transaction[],
    dailyBudget: number
): { current: number; broken: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    const checkDate = new Date(today);

    while (true) {
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTransactions = transactions.filter(t => {
            const txDate = new Date(t.created_at);
            return txDate >= dayStart && txDate <= dayEnd && t.type === 'expense';
        });

        const daySpending = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

        if (daySpending <= dailyBudget) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }

        // Stop after checking 100 days
        if (currentStreak >= 100) break;
    }

    return { current: currentStreak, broken: false };
}

export function calculateLoggingStreak(transactions: Transaction[]): { current: number; broken: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentStreak = 0;
    const checkDate = new Date(today);

    while (true) {
        const dayStart = new Date(checkDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(checkDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dayTransactions = transactions.filter(t => {
            const txDate = new Date(t.created_at);
            return txDate >= dayStart && txDate <= dayEnd;
        });

        if (dayTransactions.length > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }

        // Stop after checking 100 days
        if (currentStreak >= 100) break;
    }

    return { current: currentStreak, broken: false };
}

// ============================================
// BADGE CHECKING
// ============================================

export function checkBadgeCriteria(
    badgeCode: string,
    userData: {
        totalSavings: number;
        totalDebt: number;
        budgetStreak: number;
        loggingStreak: number;
        goalsCreated: number;
        goalsCompleted: number;
    }
): boolean {
    switch (badgeCode) {
        case 'first_10k':
            return userData.totalSavings >= 10000;
        case 'debt_free':
            return userData.totalDebt === 0;
        case 'budget_master_30':
            return userData.budgetStreak >= 30;
        case 'impulse_killer_14':
            return userData.budgetStreak >= 14;
        case 'audit_champion_30':
            return userData.loggingStreak >= 30;
        case 'empire_builder':
            return userData.totalSavings >= 100000;
        case 'streak_7':
            return userData.budgetStreak >= 7 || userData.loggingStreak >= 7;
        case 'streak_30':
            return userData.budgetStreak >= 30 || userData.loggingStreak >= 30;
        case 'streak_100':
            return userData.budgetStreak >= 100 || userData.loggingStreak >= 100;
        case 'first_goal':
            return userData.goalsCreated >= 1;
        case 'goal_crusher':
            return userData.goalsCompleted >= 5;
        default:
            return false;
    }
}

// ============================================
// SASHA COMMENTS
// ============================================

export function getSashaBadgeComment(badgeCode: string): string {
    const comments: { [key: string]: string } = {
        first_10k: "Not bad. Now let's make it 50K. Execute.",
        debt_free: "Debt-free. Finally. Now fund the empire. Next.",
        budget_master_30: "30 days under budget. Solid discipline. Your record is safe... for now.",
        impulse_killer_14: "14 days without impulse buys. I'm impressed. Don't ruin it.",
        audit_champion_30: "30 days of perfect logging. You're learning. Keep it tight.",
        empire_builder: "100K saved. You're building the empire. This is just the start. Execute.",
        streak_7: "7-day streak. Decent. But I've seen better. Show me 30.",
        streak_30: "30-day streak. Now we're talking. Don't break it.",
        streak_100: "100-day streak. You're a machine. Fund the empire. Next.",
        first_goal: "First goal set. About time. Now actually achieve it.",
        goal_crusher: "5 goals crushed. You're getting serious. I like it. Execute."
    };

    return comments[badgeCode] || "Achievement unlocked. Keep going.";
}

export function getSashaPatternComment(pattern: DetectedPattern): string {
    switch (pattern.type) {
        case 'weekend_spike':
            return `I noticed you ALWAYS overspend on weekends. Average: ${pattern.avg_amount.toFixed(0)} BDT. This is a liquidity leakage. We're setting a weekend cap. Non-negotiable.`;
        case 'payday_splurge':
            return `Payday splurge detected. You blow ${pattern.avg_amount.toFixed(0)} BDT right after salary. This is a negative ROI hobby. Transfer savings FIRST next time. Execute.`;
        case 'impulse_category':
            return `${pattern.trigger_category} is your weakness. ${pattern.frequency}. Average: ${pattern.avg_amount.toFixed(0)} BDT. This is an Impulse Acquisition Program. We're cutting it by 50%. Denied.`;
        default:
            return "Pattern detected. We need to talk about this.";
    }
}
