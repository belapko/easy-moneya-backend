import {
    defineRoute,
    type RouteModuleContract,
} from '#src/lib/route-contract';
import {apiErrorResponseSchema} from '#src/docs/schemas';
import {
    createTransactionController,
    deleteTransactionController,
    getTransactionByIdController,
    listTransactionsController,
    updateTransactionController,
} from '#src/modules/transaction/transaction.controller';
import {
    createTransactionRequestSchema,
    listTransactionsQuerySchema,
    transactionIdParamsSchema,
    transactionListResponseSchema,
    transactionResponseSchema,
    updateTransactionRequestSchema,
} from '#src/modules/transaction/transaction.schema';

const listTransactionsRoute = defineRoute({
    method: 'get',
    path: '/',
    summary: 'List transactions for current user',
    tags: ['Transaction'],
    security: [{sessionCookie: []}],
    request: {
        query: listTransactionsQuerySchema,
    },
    responses: {
        200: {
            description: 'User transactions',
            schema: transactionListResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
    },
    handler: listTransactionsController,
});

const getTransactionByIdRoute = defineRoute({
    method: 'get',
    path: '/:transactionId',
    summary: 'Get transaction by id',
    tags: ['Transaction'],
    security: [{sessionCookie: []}],
    request: {
        params: transactionIdParamsSchema,
    },
    responses: {
        200: {
            description: 'Transaction',
            schema: transactionResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Transaction not found',
            schema: apiErrorResponseSchema,
        },
    },
    handler: getTransactionByIdController,
});

const createTransactionRoute = defineRoute({
    method: 'post',
    path: '/',
    summary: 'Create transaction',
    tags: ['Transaction'],
    security: [{sessionCookie: []}],
    request: {
        body: createTransactionRequestSchema,
    },
    responses: {
        201: {
            description: 'Created transaction',
            schema: transactionResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Category not found',
            schema: apiErrorResponseSchema,
        },
    },
    handler: createTransactionController,
});

const updateTransactionRoute = defineRoute({
    method: 'patch',
    path: '/:transactionId',
    summary: 'Update transaction',
    tags: ['Transaction'],
    security: [{sessionCookie: []}],
    request: {
        params: transactionIdParamsSchema,
        body: updateTransactionRequestSchema,
    },
    responses: {
        200: {
            description: 'Updated transaction',
            schema: transactionResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Transaction or category not found',
            schema: apiErrorResponseSchema,
        },
    },
    handler: updateTransactionController,
});

const deleteTransactionRoute = defineRoute({
    method: 'delete',
    path: '/:transactionId',
    summary: 'Delete transaction',
    tags: ['Transaction'],
    security: [{sessionCookie: []}],
    request: {
        params: transactionIdParamsSchema,
    },
    responses: {
        204: {
            description: 'Transaction deleted',
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Transaction not found',
            schema: apiErrorResponseSchema,
        },
    },
    handler: deleteTransactionController,
});

export const transactionRouteModule: RouteModuleContract = {
    mountPath: '/transactions',
    routes: [
        listTransactionsRoute,
        getTransactionByIdRoute,
        createTransactionRoute,
        updateTransactionRoute,
        deleteTransactionRoute,
    ],
};
