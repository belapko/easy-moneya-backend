import bcrypt from 'bcrypt';
import {dbTransaction} from '#src/database/db';
import {HttpError} from '#src/middlewares/error';
import {createDefaultCategoriesForUser} from '#src/modules/category/category-defaults.repository';
import {
    toPublicUser,
    userRepository,
    type User,
    type UserPublic,
} from '#src/modules/user/user.repository';
import {type CreateUserRequest} from '#src/modules/user/user.schema';

export async function registerUserService(data: CreateUserRequest): Promise<User> {
    const existingUser = await userRepository.getByEmail(data.email);

    if (existingUser) {
        throw new HttpError(
            409,
            'USER_EXISTS',
            'User with this email already exists'
        );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    return dbTransaction(async (executor) => {
        const user = await userRepository.create({
            email: data.email,
            name: data.name,
            passwordHash,
        }, executor);

        await createDefaultCategoriesForUser(user.id, executor);

        return user;
    });
}

export async function getCurrentUserService(
    userId?: string,
): Promise<UserPublic> {
    if (!userId) {
        throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await userRepository.getById(userId);

    if (!user) {
        throw new HttpError(401, 'SESSION_INVALID', 'Authentication required');
    }

    return toPublicUser(user);
}
