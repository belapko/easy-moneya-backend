import {z} from '#src/lib/zod';

export const transactionKindSchema = z.enum(['income', 'expense']);

const categoryNameSchema = z.string()
    .trim()
    .min(1, {error: 'category name is required'})
    .max(100, {error: 'category name must be at most 100 characters long'});

const iconKeySchema = z.string()
    .trim()
    .min(1, {error: 'icon key is required'})
    .max(100, {error: 'icon key must be at most 100 characters long'});

const colorValueSchema = z.string()
    .trim()
    .min(1, {error: 'color must not be empty'})
    .max(32, {error: 'color must be at most 32 characters long'});

const categoryColorSchema = z.preprocess((value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();

        return trimmedValue || null;
    }

    return value;
}, colorValueSchema.nullable());

const sortOrderSchema = z.number()
    .int({error: 'sortOrder must be an integer'})
    .min(0, {error: 'sortOrder must be greater than or equal to 0'});

export const categoryIdParamsSchema = z.object({
    categoryId: z.uuid(),
});

export const createCategoryRequestSchema = z.object({
    kind: transactionKindSchema,
    name: categoryNameSchema,
    iconKey: iconKeySchema,
    color: categoryColorSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
});

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;

export const updateCategoryRequestSchema = z.object({
    name: categoryNameSchema.optional(),
    iconKey: iconKeySchema.optional(),
    color: categoryColorSchema.optional(),
    sortOrder: sortOrderSchema.optional(),
    isArchived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, {
    error: 'at least one field is required',
});

export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;

export const listCategoriesQuerySchema = z.object({
    kind: transactionKindSchema.optional(),
    includeArchived: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;

export const categoryResponseSchema = z.object({
    id: z.uuid(),
    kind: transactionKindSchema,
    code: z.string().nullable(),
    name: z.string(),
    iconKey: z.string(),
    color: z.string().nullable(),
    isSystem: z.boolean(),
    isArchived: z.boolean(),
    sortOrder: z.int(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export const categoryListResponseSchema = z.array(categoryResponseSchema);
