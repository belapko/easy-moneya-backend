import {dbQuery, type DbQueryable} from '#src/database/db';
import type {TransactionKind} from '#src/shared/schemas';

interface DefaultCategoryTemplate {
    kind: TransactionKind;
    code: string | null;
    name: string;
    iconKey: string;
    color: string;
    sortOrder: number;
}

const defaultCategoryTemplates: DefaultCategoryTemplate[] = [
    {
        kind: 'expense',
        code: 'uncategorized',
        name: 'Uncategorized',
        iconKey: 'tag',
        color: '#6B7280',
        sortOrder: 0,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Groceries',
        iconKey: 'shopping-basket',
        color: '#22C55E',
        sortOrder: 1,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Transport',
        iconKey: 'bus',
        color: '#3B82F6',
        sortOrder: 2,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Home',
        iconKey: 'house',
        color: '#F97316',
        sortOrder: 3,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Health',
        iconKey: 'heart-pulse',
        color: '#EF4444',
        sortOrder: 4,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Restaurants',
        iconKey: 'utensils',
        color: '#A855F7',
        sortOrder: 5,
    },
    {
        kind: 'expense',
        code: null,
        name: 'Entertainment',
        iconKey: 'film',
        color: '#EC4899',
        sortOrder: 6,
    },
    {
        kind: 'income',
        code: 'uncategorized',
        name: 'Uncategorized',
        iconKey: 'tag',
        color: '#6B7280',
        sortOrder: 0,
    },
    {
        kind: 'income',
        code: null,
        name: 'Salary',
        iconKey: 'wallet',
        color: '#10B981',
        sortOrder: 1,
    },
    {
        kind: 'income',
        code: null,
        name: 'Freelance',
        iconKey: 'laptop',
        color: '#06B6D4',
        sortOrder: 2,
    },
    {
        kind: 'income',
        code: null,
        name: 'Gifts',
        iconKey: 'gift',
        color: '#F59E0B',
        sortOrder: 3,
    },
    {
        kind: 'income',
        code: null,
        name: 'Cashback',
        iconKey: 'badge-percent',
        color: '#8B5CF6',
        sortOrder: 4,
    },
];

function buildDefaultCategoriesInsert() {
    const values: unknown[] = [];

    const placeholders = defaultCategoryTemplates.map((category, index) => {
        const offset = index * 8;

        values.push(
            category.kind,
            category.code,
            category.name,
            category.iconKey,
            category.color,
            true,
            false,
            category.sortOrder
        );

        return `($1, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`;
    });

    return {
        values,
        placeholders: placeholders.join(',\n                '),
    };
}

export async function createDefaultCategoriesForUser(
    userId: string,
    executor?: DbQueryable
): Promise<void> {
    const {placeholders, values} = buildDefaultCategoriesInsert();

    await dbQuery(
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
            VALUES ${placeholders}
            ON CONFLICT (user_id, kind, code) DO NOTHING
        `,
        [userId, ...values],
        executor
    );
}
