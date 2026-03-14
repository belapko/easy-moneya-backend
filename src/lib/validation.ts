import {z} from '#src/lib/zod';

export const emailSchema = z.string()
    .trim()
    .min(1, {error: 'email is required'})
    .pipe(z.email({error: 'email must be valid'}))
    .transform((value) => value.toLowerCase());

export const loginPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        error: 'password is required',
    });

export const registrationPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        error: 'password is required',
    })
    .refine((value) => value.length >= 8, {
        error: 'password must be at least 8 characters long',
    });

export const optionalNameSchema = z.preprocess((value) => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        return trimmedValue || null;
    }

    return value;
}, z.string().nullable());
