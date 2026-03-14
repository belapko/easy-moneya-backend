import {z} from 'zod';
import {
    emailSchema,
    loginPasswordSchema,
} from '#src/lib/validation';

export const loginRequestSchema = z.object({
    email: emailSchema,
    password: loginPasswordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
