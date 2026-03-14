import type {RouteModuleContract} from '#src/lib/route-contract';
import {z} from '#src/lib/zod';
import type {Request, Response} from 'express';

const healthResponseSchema = z.object({
    ok: z.literal(true),
    uptime: z.number(),
    timestamp: z.iso.datetime(),
});

function healthController(_req: Request, res: Response) {
    res.status(200).json({
        ok: true,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
}

const healthRoute = {
    method: 'get' as const,
    path: '/health',
    summary: 'Health check',
    tags: ['System'],
    responses: {
        200: {
            description: 'Application health status',
            schema: healthResponseSchema,
        },
    },
    handler: healthController,
};

export const healthRouteModule: RouteModuleContract = {
    mountPath: '',
    routes: [healthRoute],
};
