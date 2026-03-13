import {createClient} from 'redis';
import {env} from '#src/config/env';

const client = createClient({
    url: env.REDIS_URL,
});

client.on('error', (error) => {
    console.error('Redis Client Error', error);
});

export async function connectRedis(): Promise<void> {
    if (!client.isOpen) {
        await client.connect();
    }
}

export async function closeRedis(): Promise<void> {
    if (client.isOpen) {
        await client.quit();
    }
}

export async function cacheGet(key: string): Promise<string | null> {
    return client.get(key);
}

export async function cacheSet(
    key: string,
    value: string,
    ttlSeconds?: number,
): Promise<void> {
    if (ttlSeconds) {
        await client.set(key, value, {EX: ttlSeconds});
        return;
    }

    await client.set(key, value);
}
