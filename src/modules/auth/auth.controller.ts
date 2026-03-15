import type {NextFunction, Request, Response} from 'express';
import type {
    ContractRequest,
    RouteRequest,
} from '#src/lib/route-contract';
import {
    clearAuthenticatedSession,
    startAuthenticatedSession,
} from '#src/lib/session';
import {
    loginAuthService,
    registerAuthService,
} from '#src/modules/auth/auth.service';
import {loginRequestSchema} from '#src/modules/auth/auth.schema';
import {createUserRequestSchema} from '#src/modules/user/user.schema';

type RegisterControllerRequest = RouteRequest<
    ContractRequest<typeof createUserRequestSchema>
>;

type LoginControllerRequest = RouteRequest<
    ContractRequest<typeof loginRequestSchema>
>;

export async function registerController(
    req: RegisterControllerRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await registerAuthService(req.body);

        await startAuthenticatedSession(req, user.id);

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export async function loginController(
    req: LoginControllerRequest,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await loginAuthService(req.body);

        await startAuthenticatedSession(req, user.id);

        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function logoutController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        await clearAuthenticatedSession(req, res);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
