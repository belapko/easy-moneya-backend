import type {NextFunction, Response} from 'express';
import type {
    ContractRequest,
    RouteRequest,
} from '#src/lib/route-contract';
import {
    categoryIdParamsSchema,
    createCategoryRequestSchema,
    listCategoriesQuerySchema,
    updateCategoryRequestSchema,
} from '#src/modules/category/category.schema';
import {
    createCategoryService,
    deleteCategoryService,
    getCategoryByIdService,
    listCategoriesService,
    updateCategoryService,
} from '#src/modules/category/category.service';

type ListCategoriesControllerRequest = RouteRequest<
    ContractRequest<undefined, undefined, typeof listCategoriesQuerySchema>
>;

type CategoryByIdControllerRequest = RouteRequest<
    ContractRequest<undefined, typeof categoryIdParamsSchema>
>;

type CreateCategoryControllerRequest = RouteRequest<
    ContractRequest<typeof createCategoryRequestSchema>
>;

type UpdateCategoryControllerRequest = RouteRequest<
    ContractRequest<
        typeof updateCategoryRequestSchema,
        typeof categoryIdParamsSchema
    >
>;

export async function listCategoriesController(
    req: ListCategoriesControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const categories = await listCategoriesService(req.session.userId, req.query);

        res.status(200).json(categories);
    } catch (error) {
        next(error);
    }
}

export async function getCategoryByIdController(
    req: CategoryByIdControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const category = await getCategoryByIdService(
            req.session.userId,
            req.params.categoryId
        );

        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
}

export async function createCategoryController(
    req: CreateCategoryControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const category = await createCategoryService(req.session.userId, req.body);

        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
}

export async function updateCategoryController(
    req: UpdateCategoryControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const category = await updateCategoryService(
            req.session.userId,
            req.params.categoryId,
            req.body
        );

        res.status(200).json(category);
    } catch (error) {
        next(error);
    }
}

export async function deleteCategoryController(
    req: CategoryByIdControllerRequest,
    res: Response,
    next: NextFunction
) {
    try {
        await deleteCategoryService(req.session.userId, req.params.categoryId);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
