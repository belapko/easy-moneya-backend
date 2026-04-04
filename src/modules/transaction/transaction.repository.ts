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
    category_name: string;
    category_icon_key: string;
    category_color: string | null;
}

export interface TransactionCategorySummary {
    id: string;
    name: string;
    iconKey: string;
    color: string | null;
}

export interface TransactionListCursor {
    occurredAt: string;
    createdAt: string;
    id: string;
}

export interface Transaction {
    id: string;
    kind: TransactionKind;
    categoryId: string;
    category: TransactionCategorySummary;
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
    cursor?: TransactionListCursor;
    limit: number;
}

export interface PaginatedTransactionsResult {
    items: Transaction[];
    hasMore: boolean;
}

export interface CreateTransactionInput {
    userId: string;
    kind: TransactionKind;
    categoryId: string;
    amountMinor: string;
    description: string;
    occurredAt: string;
}

export interface UpdateTransactionInput {
    kind?: TransactionKind;
    categoryId?: string;
    amountMinor?: string;
    description?: string;
    occurredAt?: string;
}

const transactionColumns = `
    t.id,
    t.kind,
    t.category_id,
    t.amount_minor,
    t.description,
    t.occurred_at,
    t.created_at,
    t.updated_at,
    c.name AS category_name,
    c.icon_key AS category_icon_key,
    c.color AS category_color
`;

function mapTransaction(row: TransactionRow): Transaction {
    return {
        id: row.id,
        kind: row.kind,
        categoryId: row.category_id,
        category: {
            id: row.category_id,
            name: row.category_name,
            iconKey: row.category_icon_key,
            color: row.category_color,
        },
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
        filters: ListTransactionsFilters,
        executor?: DbQueryable
    ): Promise<PaginatedTransactionsResult> {
        const values: unknown[] = [userId];
        const conditions = ['t.user_id = $1'];

        if (filters.kind) {
            values.push(filters.kind);
            conditions.push(`t.kind = $${values.length}`);
        }

        if (filters.categoryId) {
            values.push(filters.categoryId);
            conditions.push(`t.category_id = $${values.length}`);
        }

        if (filters.occurredFrom) {
            values.push(filters.occurredFrom);
            conditions.push(`t.occurred_at >= $${values.length}`);
        }

        if (filters.occurredTo) {
            values.push(filters.occurredTo);
            conditions.push(`t.occurred_at <= $${values.length}`);
        }

        if (filters.cursor) {
            values.push(filters.cursor.occurredAt);
            const occurredAtCursorPlaceholder = `$${values.length}`;
            values.push(filters.cursor.createdAt);
            const createdAtCursorPlaceholder = `$${values.length}`;
            values.push(filters.cursor.id);
            const idCursorPlaceholder = `$${values.length}`;

            conditions.push(`
                (
                    t.occurred_at < ${occurredAtCursorPlaceholder}
                    OR (
                        t.occurred_at = ${occurredAtCursorPlaceholder}
                        AND t.created_at < ${createdAtCursorPlaceholder}
                    )
                    OR (
                        t.occurred_at = ${occurredAtCursorPlaceholder}
                        AND t.created_at = ${createdAtCursorPlaceholder}
                        AND t.id < ${idCursorPlaceholder}
                    )
                )
            `);
        }

        values.push(filters.limit + 1);
        const limitPlaceholder = `$${values.length}`;

        const result = await dbQuery<TransactionRow>(
            `
                SELECT
                    ${transactionColumns}
                FROM transactions t
                INNER JOIN categories c
                    ON c.id = t.category_id
                   AND c.user_id = t.user_id
                   AND c.kind = t.kind
                WHERE ${conditions.join(' AND ')}
                ORDER BY t.occurred_at DESC, t.created_at DESC, t.id DESC
                LIMIT ${limitPlaceholder}
            `,
            values,
            executor
        );

        const hasMore = result.rows.length > filters.limit;
        const items = result.rows.slice(0, filters.limit).map(mapTransaction);

        return {
            items,
            hasMore,
        };
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
                FROM transactions t
                INNER JOIN categories c
                    ON c.id = t.category_id
                   AND c.user_id = t.user_id
                   AND c.kind = t.kind
                WHERE t.user_id = $1
                  AND t.id = $2
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
                WITH inserted_transaction AS (
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
                        id,
                        user_id,
                        kind,
                        category_id,
                        amount_minor,
                        description,
                        occurred_at,
                        created_at,
                        updated_at
                )
                SELECT
                    t.id,
                    t.kind,
                    t.category_id,
                    t.amount_minor,
                    t.description,
                    t.occurred_at,
                    t.created_at,
                    t.updated_at,
                    c.name AS category_name,
                    c.icon_key AS category_icon_key,
                    c.color AS category_color
                FROM inserted_transaction t
                INNER JOIN categories c
                    ON c.id = t.category_id
                   AND c.user_id = t.user_id
                   AND c.kind = t.kind
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
                WITH updated_transaction AS (
                    UPDATE transactions
                    SET ${updates.join(', ')}
                    WHERE user_id = $1
                      AND id = $2
                    RETURNING
                        id,
                        user_id,
                        kind,
                        category_id,
                        amount_minor,
                        description,
                        occurred_at,
                        created_at,
                        updated_at
                )
                SELECT
                    t.id,
                    t.kind,
                    t.category_id,
                    t.amount_minor,
                    t.description,
                    t.occurred_at,
                    t.created_at,
                    t.updated_at,
                    c.name AS category_name,
                    c.icon_key AS category_icon_key,
                    c.color AS category_color
                FROM updated_transaction t
                INNER JOIN categories c
                    ON c.id = t.category_id
                   AND c.user_id = t.user_id
                   AND c.kind = t.kind
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
