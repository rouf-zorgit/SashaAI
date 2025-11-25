// Common categories used across the app
export const CATEGORIES = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Health',
    'Education',
    'Groceries',
    'Rent',
    'Utilities',
    'Salary',
    'Investment',
    'Other'
] as const;

export type Category = typeof CATEGORIES[number];
