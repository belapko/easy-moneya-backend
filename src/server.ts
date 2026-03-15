import app from '#src/app/index';
import {env} from '#src/config/env';
import {checkDatabaseConnection, closeDatabase} from '#src/database/db';
import {closeRedis, connectRedis} from '#src/database/redis';

const {PORT, HOST} = env;
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const parentPidAtStartup = process.ppid;

let server: ReturnType<typeof app.listen> | undefined;
let isShuttingDown = false;

type ConnectionError = NodeJS.ErrnoException & {
    address?: string;
    port?: number;
};

function getConnectionErrors(error: unknown): ConnectionError[] {
    if (!(error instanceof Error)) {
        return [];
    }

    if (error instanceof AggregateError) {
        return error.errors.filter((item): item is ConnectionError => item instanceof Error);
    }

    return [error as ConnectionError];
}

function isLocalDependencyRefusal(
    connectionErrors: ConnectionError[],
    port: number,
    configuredUrl: string
): boolean {
    const url = new URL(configuredUrl);

    if (!LOCALHOST_HOSTS.has(url.hostname) || Number(url.port || 0) !== port) {
        return false;
    }

    return connectionErrors.some((error) =>
        error.code === 'ECONNREFUSED'
        && error.port === port
        && LOCALHOST_HOSTS.has(error.address ?? '')
    );
}

function logStartupHints(error: unknown): void {
    const connectionErrors = getConnectionErrors(error);

    if (isLocalDependencyRefusal(connectionErrors, 5432, env.POSTGRES_URL)) {
        console.error('PostgreSQL is not reachable at localhost:5432.');
        console.error('Start local services with: docker compose -f .\\docker-compose.dev.yml up -d');
        console.error('Then apply migrations with: pnpm dbmate --url "postgresql://stepan:stepan@localhost:5432/easy-moneya?sslmode=disable" migrate');
    }

    if (isLocalDependencyRefusal(connectionErrors, 6379, env.REDIS_URL)) {
        console.error('Redis is not reachable at localhost:6379.');
        console.error('Start local services with: docker compose -f .\\docker-compose.dev.yml up -d');
    }
}

function isProcessAlive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'EPERM';
    }
}

async function bootstrap() {
    try {
        console.log('Starting API...');

        await checkDatabaseConnection();
        await connectRedis();

        server = app.listen(PORT, HOST, () => {
            console.log(`API listening on http://${HOST}:${PORT}`);
        });

    } catch (error) {
        console.error('Startup failed:', error);
        logStartupHints(error);
        process.exit(1);
    }
}

async function shutdown(signal: NodeJS.Signals | 'disconnect' | 'parent-exit') {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received, shutting down gracefully...`);

    try {
        const currentServer = server;

        if (currentServer) {
            await new Promise<void>((resolve, reject) => {
                currentServer.close((error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        await closeDatabase();
        await closeRedis();

        process.exit(0);
    } catch (error) {
        console.error('Shutdown error:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGBREAK', () => void shutdown('SIGBREAK'));
process.on('SIGHUP', () => void shutdown('SIGHUP'));
process.on('disconnect', () => void shutdown('disconnect'));

if (parentPidAtStartup > 1) {
    const parentExitWatchdog = setInterval(() => {
        if (isShuttingDown) {
            return;
        }

        if (process.ppid !== parentPidAtStartup || !isProcessAlive(parentPidAtStartup)) {
            void shutdown('parent-exit');
        }
    }, 1000);

    parentExitWatchdog.unref();
}

void bootstrap();
