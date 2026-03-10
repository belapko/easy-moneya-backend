import type {NextFunction, Request, Response} from 'express';

const isProd = process.env.NODE_ENV === 'production';

const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
) => {
    const error =
        err instanceof Error ? err : new Error('Unknown internal error');

    // TODO: логирование
    console.error('Unhandled request error:', {
        message: error.message,
        stack: isProd ? undefined : error.stack,
    });

    const statusCode = 500;
    const message = isProd ? 'Internal server error' : error.message;

    res.status(statusCode).json({
        error: {
            code: 'INTERNAL_ERROR',
            message,
        },
    });
};

export default errorHandler;
