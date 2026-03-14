import express from 'express';
import cors from 'cors';
import {env} from '#src/config/env';
import docsRouter from '#src/docs/router';
import {
    mountRouteModule,
    mountRouteModules,
} from '#src/lib/route-contract';
import {corsOptions} from '#src/middlewares/cors';
import {errorHandler} from '#src/middlewares/error';
import {sessionMiddleware} from '#src/middlewares/session';
import {apiBasePath, apiRouteModules} from '#src/routes/api';
import {healthRouteModule} from '#src/routes/health';
import notFoundRouteHandler from '#src/routes/notFound';

const app = express();

if (env.IS_PROD) {
    app.set('trust proxy', 1);
}

app.options('/{*path}', cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: false, limit: '1mb'}));
app.use(sessionMiddleware);

app.use('/docs', docsRouter);
mountRouteModule(app, healthRouteModule);
mountRouteModules(app, apiRouteModules, apiBasePath);
app.use(notFoundRouteHandler);

app.use(errorHandler);

export default app;
