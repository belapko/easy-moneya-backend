import {loadEnvFile} from 'node:process';

loadEnvFile();

function requireEnv(name: string): string {
    // eslint-disable-next-line no-restricted-properties
    const value = process.env[name];

    if (!value) {
        throw new Error(`Environment variable ${name} is required`);
    }

    return value;
}

function defaultEnv(name: string): string | undefined {
    // eslint-disable-next-line no-restricted-properties
    return process.env[name];
}

export const env = {
    REDIS_URL: requireEnv('REDIS_URL'),
    POSTGRES_URL: requireEnv('POSTGRES_URL'),
    NODE_ENV: requireEnv('NODE_ENV'),

    PORT: defaultEnv('PORT') ?? 3000,
    HOST: defaultEnv('HOST') ?? 'localhost',
    CORS_ORIGINS: defaultEnv('CORS_ORIGINS') ?? '',
};
