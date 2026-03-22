import {z} from '#src/lib/zod';
import {emailSchema} from '#src/shared/schemas';

const registrationPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        error: 'password is required',
    })
    .refine((value) => value.length >= 8, {
        error: 'password must be at least 8 characters long',
    });

const optionalNameSchema = z.preprocess((value) => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        return trimmedValue || null;
    }

    return value;
}, z.string().nullable());

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

export type UserPublicResponse = z.infer<typeof userPublicResponseSchema>;
