import {z} from '#src/lib/zod';
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

export const userPublicResponseSchema = z.object({
    id: z.uuid(),
    email: emailSchema,
    name: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});
