import bcrypt from 'bcrypt';
import {userRepository, type UserPublic} from '#src/modules/user/user.repository';

export const createUserService = async (
    data: { email: string, name?: string, password: string },
): Promise<UserPublic> => {
    const existingUser = await userRepository.getByEmail(data.email);

    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await userRepository.create({
        email: data.email,
        name: data.name ?? null,
        passwordHash,
    });

    const {passwordHash: _, ...publicUser} = user;

    return publicUser;
};
