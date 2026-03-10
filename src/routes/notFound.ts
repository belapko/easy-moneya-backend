import {Router, type Router as RouterType} from 'express';
import type {Request, Response} from 'express';

const router: RouterType = Router();

router.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found',
        },
    });
});

export default router;
