import {createUserController} from '#src/modules/user/user.controller';

import {Router} from 'express';

const router = Router();

router.post('/create', createUserController);

router.get('/:id', (req, res) => {
    res.json({id: req.params.id});
});

export default router;
