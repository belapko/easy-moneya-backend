import {HttpError} from '#src/middlewares/error';
import {
    categoryRepository,
    type Category,
} from '#src/modules/category/category.repository';
import type {
    CreateCategoryRequest,
    ListCategoriesQuery,
    UpdateCategoryRequest,
} from '#src/modules/category/category.schema';

interface PgLikeError {
    code?: string;
    constraint?: string;
    message: string;
}

const RESERVED_CATEGORY_CODE = 'uncategorized';
const UNIQUE_VIOLATION_CODE = '23505';
const FOREIGN_KEY_VIOLATION_CODE = '23503';

function getAuthenticatedUserId(userId?: string): string {
    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    return userId;
}

function isPgLikeError(error: unknown): error is PgLikeError {
    return typeof error === 'object'
        && error !== null
        && 'message' in error;
}

function mapCategoryMutationError(error: unknown): never {
    if (isPgLikeError(error)) {
        if (
            error.code === UNIQUE_VIOLATION_CODE
            && error.constraint === 'categories_user_kind_name_uq'
        ) {
            throw new HttpError(
                409,
                'CATEGORY_NAME_EXISTS',
                'Active category with this name already exists'
            );
        }

        if (error.code === FOREIGN_KEY_VIOLATION_CODE) {
            throw new HttpError(
                409,
                'CATEGORY_IN_USE',
                'Category cannot be deleted because it is used by transactions'
            );
        }
    }

    throw error;
}

async function getRequiredCategory(
    userId: string,
    categoryId: string
): Promise<Category> {
    const category = await categoryRepository.getById(userId, categoryId);

    if (!category) {
        throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
    }

    return category;
}

export async function listCategoriesService(
    userId: string | undefined,
    query: ListCategoriesQuery
): Promise<Category[]> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const filters = {
        includeArchived: query.includeArchived,
    } as {
        includeArchived: boolean;
        kind?: 'income' | 'expense';
    };

    if (query.kind !== undefined) {
        filters.kind = query.kind;
    }

    return categoryRepository.listByUser(authenticatedUserId, filters);
}

export async function getCategoryByIdService(
    userId: string | undefined,
    categoryId: string
): Promise<Category> {
    const authenticatedUserId = getAuthenticatedUserId(userId);

    return getRequiredCategory(authenticatedUserId, categoryId);
}

export async function createCategoryService(
    userId: string | undefined,
    data: CreateCategoryRequest
): Promise<Category> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const sortOrder =
        data.sortOrder
        ?? await categoryRepository.getNextSortOrder(
            authenticatedUserId,
            data.kind,
        );

    try {
        return await categoryRepository.create({
            userId: authenticatedUserId,
            kind: data.kind,
            name: data.name,
            iconKey: data.iconKey,
            color: data.color ?? null,
            sortOrder,
        });
    } catch (error) {
        mapCategoryMutationError(error);
    }
}

export async function updateCategoryService(
    userId: string | undefined,
    categoryId: string,
    data: UpdateCategoryRequest
): Promise<Category> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const existingCategory = await getRequiredCategory(authenticatedUserId, categoryId);

    if (
        existingCategory.code === RESERVED_CATEGORY_CODE
        && data.isArchived === true
    ) {
        throw new HttpError(
            409,
            'CATEGORY_RESERVED',
            'Reserved category cannot be archived'
        );
    }

    const updateData = {} as {
        name?: string;
        iconKey?: string;
        color?: string | null;
        sortOrder?: number;
        isArchived?: boolean;
    };

    if (data.name !== undefined) {
        updateData.name = data.name;
    }

    if (data.iconKey !== undefined) {
        updateData.iconKey = data.iconKey;
    }

    if (data.color !== undefined) {
        updateData.color = data.color;
    }

    if (data.sortOrder !== undefined) {
        updateData.sortOrder = data.sortOrder;
    }

    if (data.isArchived !== undefined) {
        updateData.isArchived = data.isArchived;
    }

    try {
        const updatedCategory = await categoryRepository.update(
            authenticatedUserId,
            categoryId,
            updateData
        );

        if (!updatedCategory) {
            throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }

        return updatedCategory;
    } catch (error) {
        mapCategoryMutationError(error);
    }
}

export async function deleteCategoryService(
    userId: string | undefined,
    categoryId: string
): Promise<void> {
    const authenticatedUserId = getAuthenticatedUserId(userId);
    const existingCategory = await getRequiredCategory(authenticatedUserId, categoryId);

    if (existingCategory.code === RESERVED_CATEGORY_CODE) {
        throw new HttpError(
            409,
            'CATEGORY_RESERVED',
            'Reserved category cannot be deleted'
        );
    }

    try {
        const deleted = await categoryRepository.deleteById(
            authenticatedUserId,
            categoryId
        );

        if (!deleted) {
            throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
        }
    } catch (error) {
        mapCategoryMutationError(error);
    }
}
