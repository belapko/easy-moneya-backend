import {z} from 'zod';

export const emailSchema = z.string()
    .trim()
    .min(1, 'email is required')
    .email('email must be valid')
    .transform((value) => value.toLowerCase());

export const loginPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        message: 'password is required',
    });

export const registrationPasswordSchema = z.string()
    .refine((value) => value.trim().length > 0, {
        message: 'password is required',
    })
    .refine((value) => value.length >= 8, {
        message: 'password must be at least 8 characters long',
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
