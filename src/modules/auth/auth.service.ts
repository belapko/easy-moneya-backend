import bcrypt from 'bcrypt';
import {HttpError} from '#src/middlewares/error';
import {type LoginRequest} from '#src/modules/auth/auth.schema';
import {type CreateUserRequest} from '#src/modules/user/user.schema';
import {registerUserService} from '#src/modules/user/user.service';
import {
    toPublicUser,
    userRepository,
    type UserPublic,
} from '#src/modules/user/user.repository';

function invalidCredentialsError(): HttpError {
    return new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

export async function registerAuthService(
    data: CreateUserRequest,
): Promise<UserPublic> {
    const user = await registerUserService(data);

    return toPublicUser(user);
}

export async function loginAuthService(data: LoginRequest): Promise<UserPublic> {
    const user = await userRepository.getByEmail(data.email);

    if (!user) {
        throw invalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(
        data.password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw invalidCredentialsError();
    }

    return toPublicUser(user);
}
