import {
    dbQuery,
    dbQueryOne,
    dbQueryOneOrNull,
    type DbQueryable,
} from '#src/database/db';
import type {TransactionKind} from '#src/shared/schemas';

interface CategoryRow {
    id: string;
    user_id: string;
    kind: TransactionKind;
    code: string | null;
    name: string;
    icon_key: string;
    color: string | null;
    is_system: boolean;
    is_archived: boolean;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
}

interface NextSortOrderRow {
    next_sort_order: number;
}

export interface Category {
    id: string;
    userId: string;
    kind: TransactionKind;
    code: string | null;
    name: string;
    iconKey: string;
    color: string | null;
    isSystem: boolean;
    isArchived: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ListCategoriesFilters {
    kind?: TransactionKind;
    includeArchived?: boolean;
}

export interface CreateCategoryInput {
    userId: string;
    kind: TransactionKind;
    name: string;
    iconKey: string;
    color: string | null;
    sortOrder: number;
}

export interface UpdateCategoryInput {
    name?: string;
    iconKey?: string;
    color?: string | null;
    sortOrder?: number;
    isArchived?: boolean;
}

const categoryColumns = `
    id,
    user_id,
    kind,
    code,
    name,
    icon_key,
    color,
    is_system,
    is_archived,
    sort_order,
    created_at,
    updated_at
`;

function mapCategory(row: CategoryRow): Category {
    return {
        id: row.id,
        userId: row.user_id,
        kind: row.kind,
        code: row.code,
        name: row.name,
        iconKey: row.icon_key,
        color: row.color,
        isSystem: row.is_system,
        isArchived: row.is_archived,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export const categoryRepository = {
    async listByUser(
        userId: string,
        filters: ListCategoriesFilters = {},
        executor?: DbQueryable
    ): Promise<Category[]> {
        const values: unknown[] = [userId];
        const conditions = ['user_id = $1'];

        if (filters.kind) {
            values.push(filters.kind);
            conditions.push(`kind = $${values.length}`);
        }

        if (!filters.includeArchived) {
            conditions.push('is_archived = false');
        }

        const result = await dbQuery<CategoryRow>(
            `
                SELECT
                    ${categoryColumns}
                FROM categories
                WHERE ${conditions.join(' AND ')}
                ORDER BY kind ASC, sort_order ASC, created_at ASC
            `,
            values,
            executor
        );

        return result.rows.map(mapCategory);
    },
    async getById(
        userId: string,
        categoryId: string,
        executor?: DbQueryable
    ): Promise<Category | null> {
        const result = await dbQueryOneOrNull<CategoryRow>(
            `
                SELECT
                    ${categoryColumns}
                FROM categories
                WHERE user_id = $1
                  AND id = $2
            `,
            [userId, categoryId],
            executor
        );

        return result ? mapCategory(result) : null;
    },
    async getNextSortOrder(
        userId: string,
        kind: TransactionKind,
        executor?: DbQueryable
    ): Promise<number> {
        const result = await dbQueryOne<NextSortOrderRow>(
            `
                SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
                FROM categories
                WHERE user_id = $1
                  AND kind = $2
            `,
            [userId, kind],
            executor
        );

        return result.next_sort_order;
    },
    async create(
        data: CreateCategoryInput,
        executor?: DbQueryable
    ): Promise<Category> {
        const categoryRow = await dbQueryOne<CategoryRow>(
            `
                INSERT INTO categories (
                    user_id,
                    kind,
                    code,
                    name,
                    icon_key,
                    color,
                    is_system,
                    is_archived,
                    sort_order
                )
                VALUES ($1, $2, NULL, $3, $4, $5, false, false, $6)
                RETURNING
                    ${categoryColumns}
            `,
            [
                data.userId,
                data.kind,
                data.name,
                data.iconKey,
                data.color,
                data.sortOrder,
            ],
            executor
        );

        return mapCategory(categoryRow);
    },
    async update(
        userId: string,
        categoryId: string,
        data: UpdateCategoryInput,
        executor?: DbQueryable
    ): Promise<Category | null> {
        const values: unknown[] = [userId, categoryId];
        const updates: string[] = [];

        if (data.name !== undefined) {
            values.push(data.name);
            updates.push(`name = $${values.length}`);
        }

        if (data.iconKey !== undefined) {
            values.push(data.iconKey);
            updates.push(`icon_key = $${values.length}`);
        }

        if (data.color !== undefined) {
            values.push(data.color);
            updates.push(`color = $${values.length}`);
        }

        if (data.sortOrder !== undefined) {
            values.push(data.sortOrder);
            updates.push(`sort_order = $${values.length}`);
        }

        if (data.isArchived !== undefined) {
            values.push(data.isArchived);
            updates.push(`is_archived = $${values.length}`);
        }

        const result = await dbQueryOneOrNull<CategoryRow>(
            `
                UPDATE categories
                SET ${updates.join(', ')}
                WHERE user_id = $1
                  AND id = $2
                RETURNING
                    ${categoryColumns}
            `,
            values,
            executor
        );

        return result ? mapCategory(result) : null;
    },
    async deleteById(
        userId: string,
        categoryId: string,
        executor?: DbQueryable
    ): Promise<boolean> {
        const result = await dbQuery(
            `
                DELETE FROM categories
                WHERE user_id = $1
                  AND id = $2
            `,
            [userId, categoryId],
            executor
        );

        return (result.rowCount ?? 0) > 0;
    },
};
