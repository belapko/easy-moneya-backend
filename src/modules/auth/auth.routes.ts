import type {RouteModuleContract} from '#src/lib/route-contract';
import {apiErrorResponseSchema} from '#src/docs/schemas';
import {
    loginController,
    logoutController,
    registerController,
} from '#src/modules/auth/auth.controller';
import {loginRequestSchema} from '#src/modules/auth/auth.schema';
import {
    createUserRequestSchema,
    userPublicResponseSchema,
} from '#src/modules/user/user.schema';

const registerRoute = {
    method: 'post' as const,
    path: '/register',
    summary: 'Register a new user',
    tags: ['Auth'],
    request: {
        body: createUserRequestSchema,
    },
    responses: {
        201: {
            description: 'Registered user',
            schema: userPublicResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        409: {
            description: 'User already exists',
            schema: apiErrorResponseSchema,
        },
    },
    handler: registerController,
};

const loginRoute = {
    method: 'post' as const,
    path: '/login',
    summary: 'Login with email and password',
    tags: ['Auth'],
    request: {
        body: loginRequestSchema,
    },
    responses: {
        200: {
            description: 'Authenticated user',
            schema: userPublicResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        401: {
            description: 'Invalid credentials',
            schema: apiErrorResponseSchema,
        },
    },
    handler: loginController,
};

const logoutRoute = {
    method: 'post' as const,
    path: '/logout',
    summary: 'Logout current session',
    tags: ['Auth'],
    security: [{sessionCookie: []}],
    responses: {
        204: {
            description: 'Session cleared',
        },
    },
    handler: logoutController,
};

export const authRouteModule: RouteModuleContract = {
    mountPath: '/auth',
    routes: [
        registerRoute,
        loginRoute,
        logoutRoute,
    ],
};
