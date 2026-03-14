import {loadEnvFile} from 'node:process';
import {z} from '#src/lib/zod';

loadEnvFile();

const booleanFromEnvSchema = z.preprocess((value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === 'true') {
        return true;
    }

    if (value === 'false') {
        return false;
    }

    return value;
}, z.boolean().optional());

const envSchema = z.object({
    REDIS_URL: z.string().min(1),
    POSTGRES_URL: z.string().min(1),
    SESSION_SECRET: z.string().min(1),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default('localhost'),
    CORS_ORIGINS: z.string().default(''),
    SESSION_COOKIE_NAME: z.string().default('easy-moneya.sid'),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
    SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    SESSION_COOKIE_SECURE: booleanFromEnvSchema,
}).transform((parsedEnv) => ({
    ...parsedEnv,
    IS_PROD: parsedEnv.NODE_ENV === 'production',
    SESSION_COOKIE_SECURE:
        parsedEnv.SESSION_COOKIE_SECURE
        ?? parsedEnv.NODE_ENV === 'production',
}));

// eslint-disable-next-line no-restricted-properties
export const env = envSchema.parse(process.env);
