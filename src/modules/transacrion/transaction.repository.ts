import {
    dbQuery,
    dbQueryOne,
    dbQueryOneOrNull,
    type DbQueryable,
} from '#src/database/db';
import type {TransactionKind} from '#src/shared/schemas';

interface TransactionRow {
    id: string;
    kind: TransactionKind;
    category_id: string;
    amount_minor: string;
    description: string;
    occurred_at: Date;
    created_at: Date;
    updated_at: Date;
}

export interface Transaction {
    id: string;
    kind: TransactionKind;
    categoryId: string;
    amountMinor: string;
    description: string;
    occurredAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ListTransactionsFilters {
    kind?: TransactionKind;
    categoryId?: string;
    occurredFrom?: string;
    occurredTo?: string;
}

export interface CreateTransactionInput {
    userId: string;
    kind: TransactionKind;
    categoryId: string;
    amountMinor: number;
    description: string;
    occurredAt: string;
}

export interface UpdateTransactionInput {
    kind?: TransactionKind;
    categoryId?: string;
    amountMinor?: number;
    description?: string;
    occurredAt?: string;
}

const transactionColumns = `
    id,
    kind,
    category_id,
    amount_minor,
    description,
    occurred_at,
    created_at,
    updated_at
`;

function mapTransaction(row: TransactionRow): Transaction {
    return {
        id: row.id,
        kind: row.kind,
        categoryId: row.category_id,
        amountMinor: row.amount_minor,
        description: row.description,
        occurredAt: row.occurred_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export const transactionRepository = {
    async listByUser(
        userId: string,
        filters: ListTransactionsFilters = {},
        executor?: DbQueryable
    ): Promise<Transaction[]> {
        const values: unknown[] = [userId];
        const conditions = ['user_id = $1'];

        if (filters.kind) {
            values.push(filters.kind);
            conditions.push(`kind = $${values.length}`);
        }

        if (filters.categoryId) {
            values.push(filters.categoryId);
            conditions.push(`category_id = $${values.length}`);
        }

        if (filters.occurredFrom) {
            values.push(filters.occurredFrom);
            conditions.push(`occurred_at >= $${values.length}`);
        }

        if (filters.occurredTo) {
            values.push(filters.occurredTo);
            conditions.push(`occurred_at <= $${values.length}`);
        }

        const result = await dbQuery<TransactionRow>(
            `
                SELECT
                    ${transactionColumns}
                FROM transactions
                WHERE ${conditions.join(' AND ')}
                ORDER BY occurred_at DESC, created_at DESC
            `,
            values,
            executor
        );

        return result.rows.map(mapTransaction);
    },
    async getById(
        userId: string,
        transactionId: string,
        executor?: DbQueryable
    ): Promise<Transaction | null> {
        const result = await dbQueryOneOrNull<TransactionRow>(
            `
                SELECT
                    ${transactionColumns}
                FROM transactions
                WHERE user_id = $1
                  AND id = $2
            `,
            [userId, transactionId],
            executor
        );

        return result ? mapTransaction(result) : null;
    },
    async create(
        data: CreateTransactionInput,
        executor?: DbQueryable
    ): Promise<Transaction> {
        const transactionRow = await dbQueryOne<TransactionRow>(
            `
                INSERT INTO transactions (
                    user_id,
                    kind,
                    category_id,
                    amount_minor,
                    description,
                    occurred_at
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING
                    ${transactionColumns}
            `,
            [
                data.userId,
                data.kind,
                data.categoryId,
                data.amountMinor,
                data.description,
                data.occurredAt,
            ],
            executor
        );

        return mapTransaction(transactionRow);
    },
    async update(
        userId: string,
        transactionId: string,
        data: UpdateTransactionInput,
        executor?: DbQueryable
    ): Promise<Transaction | null> {
        const values: unknown[] = [userId, transactionId];
        const updates: string[] = [];

        if (data.kind !== undefined) {
            values.push(data.kind);
            updates.push(`kind = $${values.length}`);
        }

        if (data.categoryId !== undefined) {
            values.push(data.categoryId);
            updates.push(`category_id = $${values.length}`);
        }

        if (data.amountMinor !== undefined) {
            values.push(data.amountMinor);
            updates.push(`amount_minor = $${values.length}`);
        }

        if (data.description !== undefined) {
            values.push(data.description);
            updates.push(`description = $${values.length}`);
        }

        if (data.occurredAt !== undefined) {
            values.push(data.occurredAt);
            updates.push(`occurred_at = $${values.length}`);
        }

        if (updates.length === 0) {
            throw new Error('At least one update field is required');
        }

        const result = await dbQueryOneOrNull<TransactionRow>(
            `
                UPDATE transactions
                SET ${updates.join(', ')}
                WHERE user_id = $1
                  AND id = $2
                RETURNING
                    ${transactionColumns}
            `,
            values,
            executor
        );

        return result ? mapTransaction(result) : null;
    },
    async deleteById(
        userId: string,
        transactionId: string,
        executor?: DbQueryable
    ): Promise<boolean> {
        const result = await dbQuery(
            `
                DELETE FROM transactions
                WHERE user_id = $1
                  AND id = $2
            `,
            [userId, transactionId],
            executor
        );

        return (result.rowCount ?? 0) > 0;
    },
};
