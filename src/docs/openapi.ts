import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {env} from '#src/config/env';
import {z} from '#src/lib/zod';
import {sessionCookieName} from '#src/middlewares/session';
import {loginRequestSchema} from '#src/modules/auth/auth.schema';
import {
    createUserRequestSchema,
    userPublicResponseSchema,
} from '#src/modules/user/user.schema';

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'sessionCookie', {
    type: 'apiKey',
    in: 'cookie',
    name: sessionCookieName,
    description: 'Session cookie set by express-session',
});

const healthResponseSchema = registry.register(
    'HealthResponse',
    z.object({
        ok: z.literal(true),
        uptime: z.number(),
        timestamp: z.iso.datetime(),
    }),
);

const apiErrorResponseSchema = registry.register(
    'ApiErrorResponse',
    z.object({
        error: z.object({
            code: z.string(),
            message: z.string(),
        }),
    }),
);

const createUserRequestOpenApiSchema = registry.register(
    'CreateUserRequest',
    createUserRequestSchema,
);

const loginRequestOpenApiSchema = registry.register(
    'LoginRequest',
    loginRequestSchema,
);

const userPublicResponseOpenApiSchema = registry.register(
    'UserPublicResponse',
    userPublicResponseSchema,
);

registry.registerPath({
    method: 'get',
    path: '/health',
    tags: ['System'],
    summary: 'Health check',
    responses: {
        200: {
            description: 'Application health status',
            content: {
                'application/json': {
                    schema: healthResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/auth/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: createUserRequestOpenApiSchema,
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Registered user',
            content: {
                'application/json': {
                    schema: userPublicResponseOpenApiSchema,
                },
            },
        },
        400: {
            description: 'Invalid request payload',
            content: {
                'application/json': {
                    schema: apiErrorResponseSchema,
                },
            },
        },
        409: {
            description: 'User already exists',
            content: {
                'application/json': {
                    schema: apiErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    tags: ['Auth'],
    summary: 'Login with email and password',
    request: {
        body: {
            required: true,
            content: {
                'application/json': {
                    schema: loginRequestOpenApiSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Authenticated user',
            content: {
                'application/json': {
                    schema: userPublicResponseOpenApiSchema,
                },
            },
        },
        400: {
            description: 'Invalid request payload',
            content: {
                'application/json': {
                    schema: apiErrorResponseSchema,
                },
            },
        },
        401: {
            description: 'Invalid credentials',
            content: {
                'application/json': {
                    schema: apiErrorResponseSchema,
                },
            },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/auth/logout',
    tags: ['Auth'],
    summary: 'Logout current session',
    security: [{sessionCookie: []}],
    responses: {
        204: {
            description: 'Session cleared',
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/user/me',
    tags: ['User'],
    summary: 'Get current authenticated user',
    security: [{sessionCookie: []}],
    responses: {
        200: {
            description: 'Current user',
            content: {
                'application/json': {
                    schema: userPublicResponseOpenApiSchema,
                },
            },
        },
        401: {
            description: 'Authentication required',
            content: {
                'application/json': {
                    schema: apiErrorResponseSchema,
                },
            },
        },
    },
});

export const openApiDocument = new OpenApiGeneratorV3(
    registry.definitions,
).generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'easy-moneya-backend API',
        version: '1.0.0',
        description: 'HTTP API for easy-moneya backend',
    },
    servers: [
        {
            url: env.IS_PROD ? '/' : `http://${env.HOST}:${env.PORT}`,
        },
    ],
    tags: [
        {name: 'System'},
        {name: 'Auth'},
        {name: 'User'},
    ],
});
