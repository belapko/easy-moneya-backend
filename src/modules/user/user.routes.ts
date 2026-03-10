import {createUserController} from '#src/modules/user/user.controller';

import {Router, type Router as RouterType} from 'express';

const router: RouterType = Router();

router.post('/create', createUserController);

router.get('/:id', (req, res) => {
    res.json({id: req.params.id});
});

export default router;
