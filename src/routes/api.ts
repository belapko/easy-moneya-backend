import {Router, type Router as RouterType} from 'express';
import userRouter from '#src/modules/user/user.routes';

const router: RouterType = Router();

router.use('/user', userRouter);

export default router;
