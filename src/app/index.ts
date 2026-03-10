import express, {
    type Express,
    type Request,
    type Response,
} from 'express';
import cors from 'cors';
import corsOptions from '#src/app/cors';
import errorHandler from '#src/app/error';
import notFoundRouteHandler from '#src/routes/notFound';
import apiRouter from '#src/routes/api';

const app: Express = express();

app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));

app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: false, limit: '1mb'}));

app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        ok: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

app.use('/api', apiRouter);
app.use(notFoundRouteHandler);

// error handler
app.use(errorHandler);

export default app;
