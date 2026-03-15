import {
    Pool,
    type PoolClient,
    type QueryResult,
    type QueryResultRow,
} from 'pg';
import {env} from '#src/config/env';

const SLOW_QUERY_MS = 500;

export type DbQueryable = Pick<PoolClient, 'query'>;

export const dbPool = new Pool({
    connectionString: env.POSTGRES_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

dbPool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error', error);
});

export async function checkDatabaseConnection(): Promise<void> {
    const client = await dbPool.connect();
    try {
        await client.query('SELECT 1');
    } finally {
        client.release();
    }
}

export async function closeDatabase(): Promise<void> {
    await dbPool.end();
}

async function executeQuery<T extends QueryResultRow>(
    executor: DbQueryable,
    text: string,
    values?: unknown[]
): Promise<QueryResult<T>> {
    const start = performance.now();

    try {
        const result = await executor.query<T>(text, values ?? []);

        const duration = performance.now() - start;

        if (duration > SLOW_QUERY_MS) {
            console.warn('Slow query', {
                duration: `${duration.toFixed(2)}ms`,
                text,
            });
        }

        return result;
    } catch (error) {
        console.error('Database query error', {
            text,
            values,
            error,
        });

        throw error;
    }
}

export async function dbQuery<T extends QueryResultRow>(
    text: string,
    values?: unknown[],
    executor: DbQueryable = dbPool
): Promise<QueryResult<T>> {
    return executeQuery<T>(executor, text, values);
}

export async function dbQueryOne<T extends QueryResultRow>(
    text: string,
    values?: unknown[],
    executor: DbQueryable = dbPool
): Promise<T> {
    const result = await dbQuery<T>(text, values, executor);

    const row = result.rows[0];

    if (!row) {
        throw new Error('Expected one row, but got none');
    }

    return row;
}

export async function dbQueryOneOrNull<T extends QueryResultRow>(
    text: string,
    values?: unknown[],
    executor: DbQueryable = dbPool
): Promise<T | null> {
    const result = await dbQuery<T>(text, values, executor);

    if (result.rows.length === 0) {
        return null;
    }

    if (result.rows.length > 1) {
        throw new Error(`Expected zero or one row, but got ${result.rows.length}`);
    }

    return result.rows[0]!;
}

export async function dbTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await dbPool.connect();

    try {
        await client.query('BEGIN');

        const result = await callback(client);

        await client.query('COMMIT');

        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackError) {
            console.error('Database transaction rollback error', rollbackError);
        }

        throw error;
    } finally {
        client.release();
    }
}
