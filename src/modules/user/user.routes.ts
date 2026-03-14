import {Router} from 'express';
import {meController} from '#src/modules/user/user.controller';

const router = Router();

router.get('/me', meController);

export default router;
