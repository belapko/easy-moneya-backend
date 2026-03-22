import type {RouteModuleContract} from '#src/lib/route-contract';
import {authRouteModule} from '#src/modules/auth/auth.routes';
import {categoryRouteModule} from '#src/modules/category/category.routes';
import {userRouteModule} from '#src/modules/user/user.routes';
import {transactionRouteModule} from '#src/modules/transacrion/transaction.routes';

export const apiBasePath = '/api';

export const apiRouteModules: RouteModuleContract[] = [
    authRouteModule,
    categoryRouteModule,
    userRouteModule,
    transactionRouteModule,
];
