/**
 * Centralized error messages for consistent, user-friendly error handling
 */

export const ErrorMessages = {
    // Authentication errors
    auth: {
        notAuthenticated: 'Please log in to continue',
        sessionExpired: 'Your session has expired. Please log in again',
        invalidCredentials: 'Invalid email or password. Please try again',
        emailAlreadyExists: 'An account with this email already exists',
        weakPassword: 'Password must be at least 8 characters long',
        emailNotVerified: 'Please verify your email address to continue',
    },

    // Transaction errors
    transaction: {
        insufficientBalance: (available: number, currency: string = '৳') =>
            `Not enough balance. Available: ${currency}${available.toFixed(2)}`,
        invalidAmount: 'Amount must be greater than 0',
        amountTooLarge: 'Amount is too large. Please enter a smaller amount',
        saveFailed: 'Failed to save transaction. Please check your internet connection and try again',
        deleteFailed: 'Failed to delete transaction. Please try again',
        updateFailed: 'Failed to update transaction. Please try again',
        notFound: 'Transaction not found',
    },

    // Wallet errors
    wallet: {
        notFound: 'Wallet not found',
        createFailed: 'Failed to create wallet. Please try again',
        updateFailed: 'Failed to update wallet. Please try again',
        deleteFailed: 'Failed to delete wallet. Please try again',
        insufficientBalance: (walletName: string, available: number) =>
            `Not enough balance in ${walletName}. Available: ৳${available.toFixed(2)}`,
        invalidLimit: 'Spending limit must be greater than 0',
        nameRequired: 'Wallet name is required',
        balanceUpdateFailed: 'Failed to update wallet balance. Please try again',
    },

    // Receipt errors
    receipt: {
        uploadFailed: 'Failed to upload receipt. Please check your internet connection and try again',
        extractionFailed: 'Could not read receipt automatically. Please enter details manually',
        invalidFile: 'Please upload a valid image file (JPG, PNG, or WEBP)',
        fileTooLarge: 'Image too large. Maximum size is 10MB',
        saveFailed: 'Failed to save receipt. Please try again',
        deleteFailed: 'Failed to delete receipt. Please try again',
        notFound: 'Receipt not found',
    },

    // Loan errors
    loan: {
        createFailed: 'Failed to create loan. Please try again',
        updateFailed: 'Failed to update loan. Please try again',
        deleteFailed: 'Failed to delete loan. Please try again',
        paymentFailed: 'Failed to record payment. Please try again',
        invalidAmount: 'Loan amount must be greater than 0',
        invalidInterest: 'Interest rate must be between 0 and 100',
        nameRequired: 'Loan name is required',
        notFound: 'Loan not found',
    },

    // Transfer errors
    transfer: {
        failed: 'Failed to transfer funds. Please try again',
        sameWallet: 'Cannot transfer to the same wallet',
        invalidAmount: 'Transfer amount must be greater than 0',
        insufficientBalance: (available: number) =>
            `Not enough balance to transfer. Available: ৳${available.toFixed(2)}`,
    },

    // File upload errors
    upload: {
        failed: 'Upload failed. Please check your internet connection and try again',
        invalidType: 'Invalid file type. Please upload a valid image',
        tooLarge: (maxSize: string) => `File too large. Maximum size is ${maxSize}`,
        networkError: 'Network error. Please check your connection and try again',
    },

    // Network errors
    network: {
        offline: 'You are offline. Please check your internet connection',
        timeout: 'Request timed out. Please try again',
        serverError: 'Server error. Please try again later',
        networkError: 'Network error. Please check your connection and try again',
        unknown: 'Something went wrong. Please try again',
    },

    // Validation errors
    validation: {
        required: (field: string) => `${field} is required`,
        invalid: (field: string) => `Invalid ${field}`,
        tooShort: (field: string, min: number) => `${field} must be at least ${min} characters`,
        tooLong: (field: string, max: number) => `${field} must be less than ${max} characters`,
        invalidEmail: 'Please enter a valid email address',
        invalidDate: 'Please enter a valid date',
        futureDate: 'Date cannot be in the future',
    },

    // Profile errors
    profile: {
        updateFailed: 'Failed to update profile. Please try again',
        avatarUploadFailed: 'Failed to upload profile picture. Please try again',
        invalidCurrency: 'Please select a valid currency',
        salaryRequired: 'Monthly salary is required',
    },

    // Chat errors
    chat: {
        sendFailed: 'Failed to send message. Please try again',
        loadFailed: 'Failed to load messages. Please refresh the page',
        aiError: 'Sasha is having trouble responding. Please try again',
        connectionLost: 'Connection lost. Please check your internet',
    },

    // Reports errors
    reports: {
        loadFailed: 'Failed to load reports. Please refresh the page',
        exportFailed: 'Failed to export data. Please try again',
        noData: 'No data available for the selected period',
    },
}

/**
 * Helper function to get a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
        return error
    }

    if (error instanceof Error) {
        // Map common error messages to user-friendly ones
        const message = error.message.toLowerCase()

        if (message.includes('network') || message.includes('fetch')) {
            return ErrorMessages.network.networkError
        }

        if (message.includes('timeout')) {
            return ErrorMessages.network.timeout
        }

        if (message.includes('not found')) {
            return 'The requested item was not found'
        }

        if (message.includes('permission') || message.includes('unauthorized')) {
            return ErrorMessages.auth.notAuthenticated
        }

        // Return the original message if no mapping found
        return error.message
    }

    return ErrorMessages.network.unknown
}

/**
 * Helper to create retry-able error messages
 */
export function withRetry(message: string): string {
    return `${message}. Tap to retry`
}
