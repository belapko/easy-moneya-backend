import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';
import {z, ZodError} from 'zod';

extendZodWithOpenApi(z);

export {z, ZodError};
