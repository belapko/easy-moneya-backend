import {z} from '#src/lib/zod';
import {emailSchema} from '#src/shared/schemas';

const loginPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        error: 'password is required',
    });

export const loginRequestSchema = z.object({
    email: emailSchema,
    password: loginPasswordSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
