import {dbQueryOne, dbQueryOneOrNull} from '#src/database/db';

interface UserRow {
    id: string;
    email: string;
    name: string | null;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserInput {
    email: string;
    name?: string | null;
    passwordHash: string;
}

export interface UpdateUserInput {
    email?: string;
    name?: string | null;
    passwordHash?: string;
}

export type UserPublic = Omit<User, 'passwordHash'>;

function mapUser(row: UserRow): User {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        passwordHash: row.password_hash,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toPublicUser(user: User): UserPublic {
    const {passwordHash: _passwordHash, ...publicUser} = user;

    return publicUser;
}

export const userRepository = {
    async create(data: CreateUserInput): Promise<User> {
        const userRow = await dbQueryOne<UserRow>(`
                    INSERT INTO users(email, name, password_hash)
                    VALUES ($1, $2, $3)
                    RETURNING *
            `,
            [data.email, data.name, data.passwordHash]
        );

        return mapUser(userRow);
    },
    async getByEmail(email: string): Promise<User | null> {
        const result = await dbQueryOneOrNull<UserRow>(
            `
                SELECT id, email, name, password_hash, created_at, updated_at
                FROM users
                WHERE lower(email) = lower($1)
            `,
            [email]
        );

        return result ? mapUser(result) : null;
    },
    async getById(id: string): Promise<User | null> {
        const result = await dbQueryOneOrNull<UserRow>(
            `
                SELECT id, email, name, password_hash, created_at, updated_at
                FROM users
                WHERE id = $1
            `,
            [id]
        );

        return result ? mapUser(result) : null;
    }
};
