import {
    defineRoute,
    type RouteModuleContract,
} from '#src/lib/route-contract';
import {apiErrorResponseSchema} from '#src/docs/schemas';
import {
    createCategoryController,
    deleteCategoryController,
    getCategoryByIdController,
    listCategoriesController,
    updateCategoryController,
} from '#src/modules/category/category.controller';
import {
    categoryIdParamsSchema,
    categoryListResponseSchema,
    categoryResponseSchema,
    createCategoryRequestSchema,
    listCategoriesQuerySchema,
    updateCategoryRequestSchema,
} from '#src/modules/category/category.schema';

const listCategoriesRoute = defineRoute({
    method: 'get',
    path: '/',
    summary: 'List categories for current user',
    tags: ['Category'],
    security: [{sessionCookie: []}],
    request: {
        query: listCategoriesQuerySchema,
    },
    responses: {
        200: {
            description: 'User categories',
            schema: categoryListResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
    },
    handler: listCategoriesController,
});

const getCategoryByIdRoute = defineRoute({
    method: 'get',
    path: '/:categoryId',
    summary: 'Get category by id',
    tags: ['Category'],
    security: [{sessionCookie: []}],
    request: {
        params: categoryIdParamsSchema,
    },
    responses: {
        200: {
            description: 'Category',
            schema: categoryResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Category not found',
            schema: apiErrorResponseSchema,
        },
    },
    handler: getCategoryByIdController,
});

const createCategoryRoute = defineRoute({
    method: 'post',
    path: '/',
    summary: 'Create category',
    tags: ['Category'],
    security: [{sessionCookie: []}],
    request: {
        body: createCategoryRequestSchema,
    },
    responses: {
        201: {
            description: 'Created category',
            schema: categoryResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        409: {
            description: 'Category name conflict',
            schema: apiErrorResponseSchema,
        },
    },
    handler: createCategoryController,
});

const updateCategoryRoute = defineRoute({
    method: 'patch',
    path: '/:categoryId',
    summary: 'Update category',
    tags: ['Category'],
    security: [{sessionCookie: []}],
    request: {
        params: categoryIdParamsSchema,
        body: updateCategoryRequestSchema,
    },
    responses: {
        200: {
            description: 'Updated category',
            schema: categoryResponseSchema,
        },
        400: {
            description: 'Invalid request payload',
            schema: apiErrorResponseSchema,
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Category not found',
            schema: apiErrorResponseSchema,
        },
        409: {
            description: 'Category conflict or reserved category restriction',
            schema: apiErrorResponseSchema,
        },
    },
    handler: updateCategoryController,
});

const deleteCategoryRoute = defineRoute({
    method: 'delete',
    path: '/:categoryId',
    summary: 'Delete category',
    tags: ['Category'],
    security: [{sessionCookie: []}],
    request: {
        params: categoryIdParamsSchema,
    },
    responses: {
        204: {
            description: 'Category deleted',
        },
        401: {
            description: 'Authentication required',
            schema: apiErrorResponseSchema,
        },
        404: {
            description: 'Category not found',
            schema: apiErrorResponseSchema,
        },
        409: {
            description: 'Reserved or in-use category cannot be deleted',
            schema: apiErrorResponseSchema,
        },
    },
    handler: deleteCategoryController,
});

export const categoryRouteModule: RouteModuleContract = {
    mountPath: '/categories',
    routes: [
        listCategoriesRoute,
        getCategoryByIdRoute,
        createCategoryRoute,
        updateCategoryRoute,
        deleteCategoryRoute,
    ],
};
