import express, {type Request, type Response} from 'express';
import cors from 'cors';
import {env} from '#src/config/env';
import {corsOptions} from '#src/middlewares/cors';
import {errorHandler} from '#src/middlewares/error';
import {sessionMiddleware} from '#src/middlewares/session';
import notFoundRouteHandler from '#src/routes/notFound';
import apiRouter from '#src/routes/api';

const app = express();

if (env.IS_PROD) {
    app.set('trust proxy', 1);
}

app.options('/{*path}', cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: false, limit: '1mb'}));
app.use(sessionMiddleware);

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        ok: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.use('/api', apiRouter);
app.use(notFoundRouteHandler);

app.use(errorHandler);

export default app;
