import {Router} from 'express';
import swaggerUi from 'swagger-ui-express';
import {openApiDocument} from '#src/docs/openapi';

const router = Router();

router.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
});

router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
        explorer: true,
        customSiteTitle: 'easy-moneya-backend API Docs',
    }),
);

export default router;
