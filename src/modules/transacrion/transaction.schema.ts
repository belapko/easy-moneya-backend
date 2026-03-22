import {z} from '#src/lib/zod';
import {transactionKindSchema} from '#src/shared/schemas';

const transactionAmountMinorSchema = z.number()
    .int({error: 'amountMinor must be an integer'})
    .min(1, {error: 'amountMinor must be greater than 0'});

const transactionAmountMinorResponseSchema = z.union([
    transactionAmountMinorSchema,
    z.string().trim().regex(/^[1-9]\d*$/, {
        error: 'amountMinor must be a positive integer string',
    }),
]);

const transactionDescriptionSchema = z.preprocess((value) => {
    if (value === null) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    return value;
}, z.string());

const occurredAtSchema = z.iso.datetime();

export const transactionIdParamsSchema = z.object({
    transactionId: z.uuid(),
});

export const createTransactionRequestSchema = z.object({
    kind: transactionKindSchema,
    categoryId: z.uuid(),
    amountMinor: transactionAmountMinorSchema,
    description: transactionDescriptionSchema.optional(),
    occurredAt: occurredAtSchema.optional(),
});

export type CreateTransactionRequest = z.infer<typeof createTransactionRequestSchema>;

export const updateTransactionRequestSchema = z.object({
    kind: transactionKindSchema.optional(),
    categoryId: z.uuid().optional(),
    amountMinor: transactionAmountMinorSchema.optional(),
    description: transactionDescriptionSchema.optional(),
    occurredAt: occurredAtSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
    error: 'at least one field is required',
});

export type UpdateTransactionRequest = z.infer<typeof updateTransactionRequestSchema>;

export const listTransactionsQuerySchema = z.object({
    kind: transactionKindSchema.optional(),
    categoryId: z.uuid().optional(),
    occurredFrom: occurredAtSchema.optional(),
    occurredTo: occurredAtSchema.optional(),
}).refine((value) => {
    if (!value.occurredFrom || !value.occurredTo) {
        return true;
    }

    return new Date(value.occurredFrom).getTime() <= new Date(value.occurredTo).getTime();
}, {
    error: 'occurredFrom must be earlier than or equal to occurredTo',
    path: ['occurredTo'],
});

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;

export const transactionResponseSchema = z.object({
    id: z.uuid(),
    kind: transactionKindSchema,
    categoryId: z.uuid(),
    amountMinor: transactionAmountMinorResponseSchema,
    description: z.string(),
    occurredAt: occurredAtSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export const transactionListResponseSchema = z.array(transactionResponseSchema);
