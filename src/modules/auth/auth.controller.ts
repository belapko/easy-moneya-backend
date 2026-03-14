import type {NextFunction, Request, Response} from 'express';
import {
    clearAuthenticatedSession,
    startAuthenticatedSession,
} from '#src/lib/session';
import {
    loginAuthService,
    registerAuthService,
} from '#src/modules/auth/auth.service';
import type {LoginRequest} from '#src/modules/auth/auth.schema';
import type {CreateUserRequest} from '#src/modules/user/user.schema';

export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await registerAuthService(req.body as CreateUserRequest);

        await startAuthenticatedSession(req, user.id);

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export async function loginController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const user = await loginAuthService(req.body as LoginRequest);

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
