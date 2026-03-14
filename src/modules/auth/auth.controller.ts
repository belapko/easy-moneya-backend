import type {NextFunction, Request, Response} from 'express';
import {
    clearAuthenticatedSession,
    startAuthenticatedSession,
} from '#src/lib/session';
import {loginRequestSchema} from '#src/modules/auth/auth.schema';
import {
    loginAuthService,
    registerAuthService,
} from '#src/modules/auth/auth.service';
import {createUserRequestSchema} from '#src/modules/user/user.schema';

export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const registerPayload = createUserRequestSchema.parse(req.body);
        const user = await registerAuthService(registerPayload);

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
        const loginPayload = loginRequestSchema.parse(req.body);
        const user = await loginAuthService(loginPayload);

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
