import {
    type Express,
    type NextFunction,
    type Request,
    type RequestHandler,
    type Response,
    Router,
} from 'express';
import {
    type OpenAPIRegistry,
    type ResponseConfig,
    type RouteConfig,
} from '@asteasolutions/zod-to-openapi';
import type {
    output,
    ZodType,
} from 'zod';

type RequestSchema = ZodType<unknown>;
type OpenApiRequest = NonNullable<RouteConfig['request']>;
type ParamsSchema = NonNullable<OpenApiRequest['params']>;
type QuerySchema = NonNullable<OpenApiRequest['query']>;
type DefaultRequestParams = Record<string, string>;
type DefaultRequestQuery = Record<string, string | string[] | undefined>;

export interface ContractRequest<
    TBody extends RequestSchema | undefined = undefined,
    TParams extends ParamsSchema | undefined = undefined,
    TQuery extends QuerySchema | undefined = undefined,
> {
    body?: TBody;
    params?: TParams;
    query?: TQuery;
    cookies?: NonNullable<OpenApiRequest['cookies']>;
    headers?: NonNullable<OpenApiRequest['headers']>;
}

type AnyContractRequest = ContractRequest<
    RequestSchema | undefined,
    ParamsSchema | undefined,
    QuerySchema | undefined
>;

type InferRequestBody<TRequest extends AnyContractRequest | undefined> =
    TRequest extends ContractRequest<
            infer TBody,
            ParamsSchema | undefined,
            QuerySchema | undefined
        >
        ? TBody extends RequestSchema
            ? output<TBody>
            : unknown
        : unknown;

type InferRequestParams<TRequest extends AnyContractRequest | undefined> =
    TRequest extends ContractRequest<
            RequestSchema | undefined,
            infer TParams,
            QuerySchema | undefined
        >
        ? TParams extends ParamsSchema
            ? output<TParams>
            : DefaultRequestParams
        : DefaultRequestParams;

type InferRequestQuery<TRequest extends AnyContractRequest | undefined> =
    TRequest extends ContractRequest<
            RequestSchema | undefined,
            ParamsSchema | undefined,
            infer TQuery
        >
        ? TQuery extends QuerySchema
            ? output<TQuery>
            : DefaultRequestQuery
        : DefaultRequestQuery;

export type RouteRequest<
    TRequest extends AnyContractRequest | undefined = undefined,
    TResponseBody = unknown,
    TLocals extends Record<string, unknown> = Record<string, unknown>,
> = Request<
    InferRequestParams<TRequest>,
    TResponseBody,
    InferRequestBody<TRequest>,
    InferRequestQuery<TRequest>,
    TLocals
>;

type RouteHandler<
    TRequest extends AnyContractRequest | undefined = undefined,
    TResponseBody = unknown,
    TLocals extends Record<string, unknown> = Record<string, unknown>,
> = {
    bivarianceHack(
        req: RouteRequest<TRequest, TResponseBody, TLocals>,
        res: Response<TResponseBody, TLocals>,
        next: NextFunction,
    ): unknown;
}['bivarianceHack'];

interface ContractResponse {
    description: string;
    schema?: RequestSchema;
}

export interface RouteContract<
    TRequest extends AnyContractRequest | undefined = AnyContractRequest | undefined,
> {
    method: RouteConfig['method'];
    path: string;
    summary: string;
    description?: string;
    tags: string[];
    security?: RouteConfig['security'];
    request?: TRequest;
    responses: Record<number | string, ContractResponse>;
    handler: RouteHandler<TRequest>;
    middlewares?: RequestHandler[];
}

export interface RouteModuleContract {
    mountPath: string;
    routes: RouteContract[];
}

export function defineRoute<
    TRequest extends AnyContractRequest | undefined = undefined,
>(
    route: RouteContract<TRequest>,
): RouteContract<TRequest> {
    return route;
}

function joinRoutePaths(...paths: string[]): string {
    const segments = paths
        .filter(Boolean)
        .map((path) => path.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean);

    if (segments.length === 0) {
        return '/';
    }

    return `/${segments.join('/')}`;
}

function validateRequest<TRequest extends AnyContractRequest | undefined>(
    request?: TRequest,
): RequestHandler<
    InferRequestParams<TRequest>,
    unknown,
    InferRequestBody<TRequest>,
    InferRequestQuery<TRequest>
> {
    return (req, _res, next) => {
        try {
            if (request?.body) {
                req.body = request.body.parse(req.body) as InferRequestBody<TRequest>;
            }

            if (request?.params) {
                req.params = request.params.parse(req.params) as InferRequestParams<TRequest>;
            }

            if (request?.query) {
                Object.defineProperty(req, 'query', {
                    configurable: true,
                    enumerable: true,
                    value: request.query.parse(req.query) as InferRequestQuery<TRequest>,
                    writable: true,
                });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

function buildOpenApiRequest(
    request?: AnyContractRequest,
): RouteConfig['request'] {
    if (!request) {
        return undefined;
    }

    const openApiRequest: NonNullable<RouteConfig['request']> = {};

    if (request.body) {
        openApiRequest.body = {
            required: true,
            content: {
                'application/json': {
                    schema: request.body,
                },
            },
        };
    }

    if (request.params) {
        openApiRequest.params = request.params;
    }

    if (request.query) {
        openApiRequest.query = request.query;
    }

    if (request.cookies) {
        openApiRequest.cookies = request.cookies;
    }

    if (request.headers) {
        openApiRequest.headers = request.headers;
    }

    return openApiRequest;
}

function buildOpenApiResponses(
    responses: RouteContract['responses'],
): RouteConfig['responses'] {
    const openApiResponses: RouteConfig['responses'] = {};

    for (const [statusCode, response] of Object.entries(responses)) {
        const responseConfig: ResponseConfig = {
            description: response.description,
        };

        if (response.schema) {
            responseConfig.content = {
                'application/json': {
                    schema: response.schema,
                },
            };
        }

        openApiResponses[statusCode] = responseConfig;
    }

    return openApiResponses;
}

function createRouteModuleRouter(
    routeModule: RouteModuleContract,
) {
    const router = Router();

    for (const route of routeModule.routes) {
        const handlers: RequestHandler[] = [
            validateRequest(route.request),
            ...(route.middlewares ?? []),
            route.handler,
        ];

        router[route.method](route.path, ...handlers);
    }

    return router;
}

export function mountRouteModule(
    app: Express,
    routeModule: RouteModuleContract,
    basePath = '',
): void {
    const router = createRouteModuleRouter(routeModule);
    app.use(joinRoutePaths(basePath, routeModule.mountPath), router);
}

export function registerRouteModuleOpenApi(
    registry: OpenAPIRegistry,
    routeModule: RouteModuleContract,
    basePath = '',
): void {
    for (const route of routeModule.routes) {
        const routeConfig: RouteConfig = {
            method: route.method,
            path: joinRoutePaths(basePath, routeModule.mountPath, route.path),
            tags: route.tags,
            responses: buildOpenApiResponses(route.responses),
            summary: route.summary,
        };

        if (route.description) {
            routeConfig.description = route.description;
        }

        if (route.security) {
            routeConfig.security = route.security;
        }

        const openApiRequest = buildOpenApiRequest(route.request);

        if (openApiRequest) {
            routeConfig.request = openApiRequest;
        }

        registry.registerPath(routeConfig);
    }
}

export function mountRouteModules(
    app: Express,
    routeModules: RouteModuleContract[],
    basePath = '',
): void {
    for (const routeModule of routeModules) {
        mountRouteModule(app, routeModule, basePath);
    }
}

export function registerRouteModulesOpenApi(
    registry: OpenAPIRegistry,
    routeModules: RouteModuleContract[],
    basePath = '',
): void {
    for (const routeModule of routeModules) {
        registerRouteModuleOpenApi(registry, routeModule, basePath);
    }
}
