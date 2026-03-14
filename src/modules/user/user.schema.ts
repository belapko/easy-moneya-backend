import {z} from 'zod';
import {
    emailSchema,
    optionalNameSchema,
    registrationPasswordSchema,
} from '#src/lib/validation';

export const createUserRequestSchema = z.object({
    email: emailSchema,
    name: optionalNameSchema,
    password: registrationPasswordSchema,
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
