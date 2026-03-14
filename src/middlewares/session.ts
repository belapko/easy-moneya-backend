import session from 'express-session';
import {RedisStore} from 'connect-redis';
import {env} from '#src/config/env';
import {redisClient} from '#src/database/redis';

declare module 'express-session' {
    interface SessionData {
        userId: string;
    }
}

const sessionCookieBaseOptions = {
    httpOnly: true,
    sameSite: env.SESSION_COOKIE_SAME_SITE,
    secure: env.SESSION_COOKIE_SECURE,
    path: '/',
};

const sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'session:',
    ttl: env.SESSION_TTL_SECONDS,
});

export const sessionCookieName = env.SESSION_COOKIE_NAME;
export const sessionCookieClearOptions = sessionCookieBaseOptions;

export const sessionMiddleware = session({
    name: sessionCookieName,
    secret: env.SESSION_SECRET,
    store: sessionStore,
    proxy: env.IS_PROD,
    // Keep browser cookie expiry aligned with Redis TTL for active sessions.
    rolling: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
        ...sessionCookieBaseOptions,
        maxAge: env.SESSION_TTL_SECONDS * 1000,
    },
});
