import {HttpError} from '#src/middlewares/error';
import {
    transactionRepository,
    type Transaction,
} from '#src/modules/transacrion/transaction.repository';
import type {
    CreateTransactionRequest,
    ListTransactionsQuery,
    UpdateTransactionRequest,
} from '#src/modules/transacrion/transaction.schema';

interface PgLikeError {
    code?: string;
    constraint?: string;
    message: string;
}

const FOREIGN_KEY_VIOLATION_CODE = '23503';
const CHECK_VIOLATION_CODE = '23514';

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
                'INVALID_AMOUNT_MINOR',
                'amountMinor must be greater than 0'
            );
        }
    }

    throw error;
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
): Promise<Transaction[]> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const filters = {
        occurredFrom: query.occurredFrom,
        occurredTo: query.occurredTo,
    } as {
        kind?: 'income' | 'expense';
        categoryId?: string;
        occurredFrom?: string;
        occurredTo?: string;
    };

    if (query.kind !== undefined) {
        filters.kind = query.kind;
    }

    if (query.categoryId !== undefined) {
        filters.categoryId = query.categoryId;
    }

    return transactionRepository.listByUser(authenticatedUserId, filters);
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
            amountMinor: data.amountMinor,
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
        amountMinor?: number;
        description?: string;
        occurredAt?: string;
    };

    if (data.kind !== undefined) {
        updateData.kind = data.kind;
    }

    if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
    }

    if (data.amountMinor !== undefined) {
        updateData.amountMinor = data.amountMinor;
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
