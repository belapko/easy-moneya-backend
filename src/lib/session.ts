import type {Request, Response} from 'express';
import {
    sessionCookieClearOptions,
    sessionCookieName,
} from '#src/middlewares/session';

function regenerateSession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session.regenerate((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

function saveSession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session.save((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

export function destroySession(req: Request): Promise<void> {
    return new Promise((resolve, reject) => {
        req.session.destroy((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
}

export async function startAuthenticatedSession(
    req: Request,
    userId: string,
): Promise<void> {
    await regenerateSession(req);
    req.session.userId = userId;
    await saveSession(req);
}

export async function clearAuthenticatedSession(
    req: Request,
    res: Response,
): Promise<void> {
    if (req.session.userId) {
        await destroySession(req);
    }

    res.clearCookie(sessionCookieName, sessionCookieClearOptions);
}
