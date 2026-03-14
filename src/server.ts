import app from '#src/app/index';
import {env} from '#src/config/env';
import {checkDatabaseConnection, closeDatabase} from '#src/database/db';
import {closeRedis, connectRedis} from '#src/database/redis';

const {PORT, HOST} = env;

let server: ReturnType<typeof app.listen>;
let isShuttingDown = false;

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
        process.exit(1);
    }
}

async function shutdown(signal: NodeJS.Signals) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received, shutting down gracefully...`);

    try {
        if (server) {
            await new Promise<void>((resolve, reject) => {
                server.close((error) => {
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

void bootstrap();
