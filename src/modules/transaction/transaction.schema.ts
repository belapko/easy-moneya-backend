import {z} from '#src/lib/zod';
import {safeParseTransactionAmountToMinorUnits} from '#src/modules/transaction/transaction-amount';
import {transactionKindSchema} from '#src/shared/schemas';

const transactionDescriptionSchema = z.preprocess((value) => {
    if (value === null) {
        return '';
    }

    if (typeof value === 'string') {
        return value.trim();
    }

    return value;
}, z.string());

const transactionAmountSchema = z.string()
    .trim()
    .min(1, {error: 'amount is required'})
    .superRefine((value, ctx) => {
        if (value.length === 0) {
            return;
        }

        const result = safeParseTransactionAmountToMinorUnits(value);

        if (!result.success) {
            ctx.addIssue({
                code: 'custom',
                message: result.message,
            });
        }
    });

const occurredAtSchema = z.iso.datetime();
const transactionAmountResponseSchema = z.string().regex(/^(?:0|[1-9]\d*)\.\d{2}$/, {
    error: 'amount must be a decimal string with exactly 2 fractional digits',
});

export const transactionIdParamsSchema = z.object({
    transactionId: z.uuid(),
});

export const createTransactionRequestSchema = z.object({
    kind: transactionKindSchema,
    categoryId: z.uuid(),
    amount: transactionAmountSchema,
    description: transactionDescriptionSchema.optional(),
    occurredAt: occurredAtSchema.optional(),
});

export type CreateTransactionRequest = z.infer<typeof createTransactionRequestSchema>;

export const updateTransactionRequestSchema = z.object({
    kind: transactionKindSchema.optional(),
    categoryId: z.uuid().optional(),
    amount: transactionAmountSchema.optional(),
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
    amount: transactionAmountResponseSchema,
    description: z.string(),
    occurredAt: occurredAtSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;

export const transactionListResponseSchema = z.array(transactionResponseSchema);
