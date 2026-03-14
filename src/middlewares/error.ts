import type {NextFunction, Request, Response} from 'express';
import {ZodError} from 'zod';
import {env} from '#src/config/env';

export class HttpError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = 'HttpError';
    }
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    const error =
        err instanceof Error ? err : new Error('Unknown internal error');

    if (error instanceof ZodError) {
        const firstIssue = error.issues[0];

        res.status(400).json({
            error: {
                code: 'BAD_REQUEST',
                message: firstIssue?.message ?? 'Invalid request payload',
            },
        });

        return;
    }

    const httpError =
        error instanceof HttpError
            ? error
            : new HttpError(500, 'INTERNAL_ERROR', error.message);

    console.error('Unhandled request error:', {
        message: error.message,
        code: httpError.code,
        statusCode: httpError.statusCode,
        stack: env.IS_PROD ? undefined : error.stack,
    });

    const message =
        env.IS_PROD && httpError.statusCode >= 500
            ? 'Internal server error'
            : httpError.message;

    res.status(httpError.statusCode).json({
        error: {
            code: httpError.code,
            message,
        },
    });
}
