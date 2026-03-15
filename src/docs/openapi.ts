import {
    OpenAPIRegistry,
    OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {env} from '#src/config/env';
import {
    registerRouteModuleOpenApi,
    registerRouteModulesOpenApi,
} from '#src/lib/route-contract';
import {sessionCookieName} from '#src/middlewares/session';
import {
    apiBasePath,
    apiRouteModules,
} from '#src/routes/api';
import {healthRouteModule} from '#src/routes/health';

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'sessionCookie', {
    type: 'apiKey',
    in: 'cookie',
    name: sessionCookieName,
    description: 'Session cookie set by express-session',
});

registerRouteModuleOpenApi(registry, healthRouteModule);
registerRouteModulesOpenApi(registry, apiRouteModules, apiBasePath);

export const openApiDocument = new OpenApiGeneratorV3(
    registry.definitions,
).generateDocument({
    openapi: '3.0.0',
    info: {
        title: 'easy-moneya-backend API',
        version: '1.0.0',
        description: 'HTTP API for easy-moneya backend',
    },
    servers: [
        {
            url: env.IS_PROD ? '/' : `http://${env.HOST}:${env.PORT}`,
        },
    ],
    tags: [
        {name: 'System'},
        {name: 'Auth'},
        {name: 'Category'},
        {name: 'User'},
    ],
});
