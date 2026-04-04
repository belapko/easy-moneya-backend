import {HttpError} from '#src/middlewares/error';
import {z} from '#src/lib/zod';
import {safeParseTransactionAmountToMinorUnits} from '#src/modules/transaction/transaction-amount';
import {
    type PaginatedTransactionsResult,
    transactionRepository,
    type TransactionListCursor,
    type Transaction,
} from '#src/modules/transaction/transaction.repository';
import type {
    CreateTransactionRequest,
    ListTransactionsQuery,
    UpdateTransactionRequest,
} from '#src/modules/transaction/transaction.schema';

interface PgLikeError {
    code?: string;
    constraint?: string;
    message: string;
}

const FOREIGN_KEY_VIOLATION_CODE = '23503';
const CHECK_VIOLATION_CODE = '23514';
const transactionListCursorSchema = z.object({
    occurredAt: z.iso.datetime(),
    createdAt: z.iso.datetime(),
    id: z.uuid(),
});

export interface TransactionListPage {
    items: Transaction[];
    nextCursor: string | null;
}

function getAuthenticatedUserId(userId?: string): string {
    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    return userId;
}

function isPgLikeError(error: unknown): error is PgLikeError {
    return typeof error === 'object'
        && error !== null
        && 'message' in error;
}

function getAmountMinorFromAmount(amount: string): string {
    const result = safeParseTransactionAmountToMinorUnits(amount);

    if (!result.success) {
        throw new HttpError(400, 'INVALID_AMOUNT', result.message);
    }

    return result.amountMinor;
}

function mapTransactionMutationError(error: unknown): never {
    if (isPgLikeError(error)) {
        if (
            error.code === FOREIGN_KEY_VIOLATION_CODE
            && error.constraint === 'transactions_category_fk'
        ) {
            throw new HttpError(
                404,
                'CATEGORY_NOT_FOUND',
                'Category not found for this user and kind'
            );
        }

        if (
            error.code === CHECK_VIOLATION_CODE
            && error.constraint === 'transactions_amount_minor_positive'
        ) {
            throw new HttpError(
                400,
                'INVALID_AMOUNT',
                'amount must be greater than 0'
            );
        }
    }

    throw error;
}

function decodeTransactionListCursor(cursor: string): TransactionListCursor {
    try {
        const parsedCursor = JSON.parse(
            Buffer.from(cursor, 'base64url').toString('utf8')
        ) as unknown;

        return transactionListCursorSchema.parse(parsedCursor);
    } catch {
        throw new HttpError(400, 'INVALID_CURSOR', 'cursor is invalid');
    }
}

function encodeTransactionListCursor(transaction: Transaction): string {
    return Buffer.from(JSON.stringify({
        occurredAt: transaction.occurredAt.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        id: transaction.id,
    }), 'utf8').toString('base64url');
}

function toTransactionListPage(
    page: PaginatedTransactionsResult
): TransactionListPage {
    return {
        items: page.items,
        nextCursor: page.hasMore && page.items.length > 0
            ? encodeTransactionListCursor(page.items[page.items.length - 1]!)
            : null,
    };
}

async function getRequiredTransaction(
    userId: string,
    transactionId: string
): Promise<Transaction> {
    const transaction = await transactionRepository.getById(userId, transactionId);

    if (!transaction) {
        throw new HttpError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    }

    return transaction;
}

export async function listTransactionsService(
    userId: string | undefined,
    query: ListTransactionsQuery
): Promise<TransactionListPage> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const filters = {
        limit: query.limit,
        occurredFrom: query.occurredFrom,
        occurredTo: query.occurredTo,
    } as {
        kind?: 'income' | 'expense';
        categoryId?: string;
        occurredFrom?: string;
        occurredTo?: string;
        cursor?: TransactionListCursor;
        limit: number;
    };

    if (query.kind !== undefined) {
        filters.kind = query.kind;
    }

    if (query.categoryId !== undefined) {
        filters.categoryId = query.categoryId;
    }

    if (query.cursor !== undefined) {
        filters.cursor = decodeTransactionListCursor(query.cursor);
    }

    const page = await transactionRepository.listByUser(authenticatedUserId, filters);

    return toTransactionListPage(page);
}

export async function getTransactionByIdService(
    userId: string | undefined,
    transactionId: string
): Promise<Transaction> {
    const authenticatedUserId = getAuthenticatedUserId(userId);

    return getRequiredTransaction(authenticatedUserId, transactionId);
}

export async function createTransactionService(
    userId: string | undefined,
    data: CreateTransactionRequest
): Promise<Transaction> {
    const authenticatedUserId = getAuthenticatedUserId(userId);

    try {
        return await transactionRepository.create({
            userId: authenticatedUserId,
            kind: data.kind,
            categoryId: data.categoryId,
            amountMinor: getAmountMinorFromAmount(data.amount),
            description: data.description ?? '',
            occurredAt: data.occurredAt ?? new Date().toISOString(),
        });
    } catch (error) {
        mapTransactionMutationError(error);
    }
}

export async function updateTransactionService(
    userId: string | undefined,
    transactionId: string,
    data: UpdateTransactionRequest
): Promise<Transaction> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const updateData = {} as {
        kind?: 'income' | 'expense';
        categoryId?: string;
        amountMinor?: string;
        description?: string;
        occurredAt?: string;
    };

    if (data.kind !== undefined) {
        updateData.kind = data.kind;
    }

    if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
    }

    if (data.amount !== undefined) {
        updateData.amountMinor = getAmountMinorFromAmount(data.amount);
    }

    if (data.description !== undefined) {
        updateData.description = data.description;
    }

    if (data.occurredAt !== undefined) {
        updateData.occurredAt = data.occurredAt;
    }

    try {
        const updatedTransaction = await transactionRepository.update(
            authenticatedUserId,
            transactionId,
            updateData
        );

        if (!updatedTransaction) {
            throw new HttpError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
        }

        return updatedTransaction;
    } catch (error) {
        mapTransactionMutationError(error);
    }
}

export async function deleteTransactionService(
    userId: string | undefined,
    transactionId: string
): Promise<void> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const deleted = await transactionRepository.deleteById(
        authenticatedUserId,
        transactionId
    );

    if (!deleted) {
        throw new HttpError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
    }
}
