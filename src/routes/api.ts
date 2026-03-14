import type {RouteModuleContract} from '#src/lib/route-contract';
import {authRouteModule} from '#src/modules/auth/auth.routes';
import {userRouteModule} from '#src/modules/user/user.routes';

export const apiBasePath = '/api';

export const apiRouteModules: RouteModuleContract[] = [
    authRouteModule,
    userRouteModule,
];
