import jwt from 'jsonwebtoken';
import { User } from '../SocketManager';
import { WebSocket } from 'ws';

export interface AuthUser {
	id: string;
	username: string;
	isGuest: boolean;
}

function isAuthUser(value: unknown): value is AuthUser {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const user = value as Record<string, unknown>;

	return (
		typeof user.id === "string" &&
		typeof user.username === "string" &&
		typeof user.isGuest === "boolean"
	);
}


export const getAuthUser = (token: string, ws: WebSocket): User | null => {
	// NOTE: Shouldnt check per req
	if (!process.env.JWT_SECRET) {
		return null;
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		if (!isAuthUser(decoded)) {
			return null;
		}

		return new User(ws, decoded);
	} catch {
		return null;
	}
};
