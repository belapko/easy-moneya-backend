import {createClient, type RedisClientType} from 'redis';
import {env} from '#src/config/env';

export const redisClient: RedisClientType = createClient({
    url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
    console.error('Redis Client Error', error);
});

export async function connectRedis(): Promise<void> {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

export async function closeRedis(): Promise<void> {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
}
