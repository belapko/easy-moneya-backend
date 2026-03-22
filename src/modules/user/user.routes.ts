import {
    defineRoute,
    type RouteModuleContract,
} from '#src/lib/route-contract';
import {apiErrorResponseSchema} from '#src/docs/schemas';
import {meController} from '#src/modules/user/user.controller';
import {userPublicResponseSchema} from '#src/modules/user/user.schema';

const meRoute = defineRoute({
    method: 'get',
    path: '/me',
    summary: 'Get current authenticated user',
    tags: ['User'],
    security: [{sessionCookie: []}],
    responses: {
        200: {
            description: 'Current user',
            schema: userPublicResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
    },
    handler: meController,
});

export const userRouteModule: RouteModuleContract = {
    mountPath: '/user',
    routes: [meRoute],
};
