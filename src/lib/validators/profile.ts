import { z } from 'zod';

export const profileSchema = z.object({
    full_name: z.string().min(1).optional(),
    monthly_salary: z.number().min(0).optional(),
    // Add other fields as needed based on future requirements, 
    // currently these are the main editable ones from the prompt requirements
});

export type ProfileUpdateInput = z.infer<typeof profileSchema>;
