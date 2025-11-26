import { z } from 'zod';

export const profileSchema = z.object({
    full_name: z.string().min(1).optional(),
    monthly_salary: z.number().min(0).optional(),
    currency: z.string().optional(),
    fixed_costs: z.number().min(0).optional(),
    primary_goal: z.string().optional(),
    communication_style: z.string().optional(),
    onboarding_completed: z.boolean().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileSchema>;
