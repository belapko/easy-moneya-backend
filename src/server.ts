import 'dotenv/config';
import app from '#src/app/index';
import {checkDatabaseConnection, dbPool} from '#src/database/db';


const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? 'localhost';

let server: ReturnType<typeof app.listen>;
let isShuttingDown = false;

async function bootstrap() {
    try {
        console.log('Starting API...');

        await checkDatabaseConnection();

        server = app.listen(port, host, () => {
            console.log(`API listening on http://${host}:${port}`);
        });

    } catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
}

const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received, shutting down gracefully...`);

    try {
        await new Promise<void>((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await dbPool.end();

        process.exit(0);
    } catch (error) {
        console.error('Shutdown error:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void bootstrap();
