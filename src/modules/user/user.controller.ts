import type {Request, Response, NextFunction} from 'express';
import {createUserService} from '#src/modules/user/user.service';

export async function createUserController(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await createUserService(req.body);

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}
