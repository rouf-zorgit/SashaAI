import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
})

export const onboardingSchema = z.object({
    full_name: z.string().min(2, 'Full name is required'),
    currency: z.string().length(3, 'Currency must be a 3-letter code'),
    monthly_salary: z.number().min(0, 'Salary must be a positive number'),
    primary_goal: z.string().min(1, 'Primary goal is required'),
})
