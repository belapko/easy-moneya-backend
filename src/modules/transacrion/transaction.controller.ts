import type {NextFunction, Response} from 'express';
import type {
    ContractRequest,
    RouteRequest,
} from '#src/lib/route-contract';
import {
    createTransactionRequestSchema,
    listTransactionsQuerySchema,
    transactionIdParamsSchema,
    updateTransactionRequestSchema,
} from '#src/modules/transacrion/transaction.schema';
import {
    createTransactionService,
    deleteTransactionService,
    getTransactionByIdService,
    listTransactionsService,
    updateTransactionService,
} from '#src/modules/transacrion/transaction.service';

type ListTransactionsControllerRequest = RouteRequest<
    ContractRequest<undefined, undefined, typeof listTransactionsQuerySchema>
>;

type TransactionByIdControllerRequest = RouteRequest<
    ContractRequest<undefined, typeof transactionIdParamsSchema>
>;

type CreateTransactionControllerRequest = RouteRequest<
    ContractRequest<typeof createTransactionRequestSchema>
>;

type UpdateTransactionControllerRequest = RouteRequest<
    ContractRequest<
        typeof updateTransactionRequestSchema,
        typeof transactionIdParamsSchema
    >
>;

export async function listTransactionsController(
    req: ListTransactionsControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const transactions = await listTransactionsService(req.session.userId, req.query);

        res.status(200).json(transactions);
    } catch (error) {
        next(error);
    }
}

export async function getTransactionByIdController(
    req: TransactionByIdControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const transaction = await getTransactionByIdService(
            req.session.userId,
            req.params.transactionId
        );

        res.status(200).json(transaction);
    } catch (error) {
        next(error);
    }
}

export async function createTransactionController(
    req: CreateTransactionControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const transaction = await createTransactionService(req.session.userId, req.body);

        res.status(201).json(transaction);
    } catch (error) {
        next(error);
    }
}

export async function updateTransactionController(
    req: UpdateTransactionControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const transaction = await updateTransactionService(
            req.session.userId,
            req.params.transactionId,
            req.body
        );

        res.status(200).json(transaction);
    } catch (error) {
        next(error);
    }
}

export async function deleteTransactionController(
    req: TransactionByIdControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        await deleteTransactionService(req.session.userId, req.params.transactionId);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
