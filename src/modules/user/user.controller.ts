import type {NextFunction, Request, Response} from 'express';
import {HttpError} from '#src/middlewares/error';
import {clearAuthenticatedSession} from '#src/lib/session';
import {getCurrentUserService} from '#src/modules/user/user.service';

export async function meController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getCurrentUserService(req.session.userId);

        res.status(200).json(user);
    } catch (error) {
        if (
            error instanceof HttpError
            && error.statusCode === 401
            && req.session.userId
        ) {
            try {
                await clearAuthenticatedSession(req, res);
            } catch (destroyError) {
                next(destroyError);
                return;
            }
        }

        next(error);
    }
}
