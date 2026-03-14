import {type CorsOptions} from 'cors';
import {env} from '#src/config/env';

const allowedOrigins = env.CORS_ORIGINS
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (!origin || !env.IS_PROD || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};
