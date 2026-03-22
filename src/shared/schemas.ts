import {z} from '#src/lib/zod';

export const emailSchema = z.string()
    .trim()
    .min(1, {error: 'email is required'})
    .pipe(z.email({error: 'email must be valid'}))
    .transform((value) => value.toLowerCase());

export const transactionKindSchema = z.enum(['income', 'expense']);

export type TransactionKind = z.infer<typeof transactionKindSchema>;
