import type { CookieOptions, Request, Response } from 'express';
import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { COOKIE_MAX_AGE } from '../constants';

const cookieConfig: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: "lax",
	maxAge: COOKIE_MAX_AGE
};

const CLIENT_URL =
	process.env.AUTH_REDIRECT_URL ?? 'http://localhost:5173/game/random';

const CLIENT = 'http://localhost:3000/';

if (!process.env.JWT_SECRET) {
	throw new Error("JWT_SECRET must be set in environment variables");
}

const JWT_SECRET = process.env.JWT_SECRET;

interface AuthUser {
	id: string;
	username: string;
	isGuest: boolean;
}

function createToken(id: string, username: string, isGuest: boolean) {
	return jwt.sign(
		{ id, username, isGuest },
		JWT_SECRET,
		{ expiresIn: '1d' }
	);
}

const router = Router();


router.post('/guest', async (_req: Request, res: Response) => {
	try {
		let guestUUID = 'guest-' + uuidv4();

		const user = await db.user.create({
			data: {
				username: guestUUID,
				email: guestUUID + '@topchess.com',
				name: guestUUID,
				provider: 'GUEST',
			},
		});

		const token = createToken(user.id, user.username, true);

		const guestDetails: AuthUser = {
			id: user.id,
			username: user.username,
			isGuest: true,
		};

		res.cookie('guest', token, cookieConfig);
		res.json(guestDetails);

	} catch (error) {
		return res.json({ msg: "Failed to login as guest" });
	}

});

router.get('/refresh', async (req: Request, res: Response) => {
	try {
		if (req.user) {
			const user = req.user as AuthUser;

			const token = createToken(user.id, user.username, false);
			res.cookie("jwt", token, cookieConfig);

			res.json({
				success: true,
				msg: 'token refreshed successfully'
			});

		} else if (req.cookies && req.cookies.guest) {
			const decoded = jwt.verify(req.cookies.guest, JWT_SECRET) as AuthUser;

			const token = createToken(decoded.id, decoded.username, true);

			res.cookie('guest', token, cookieConfig);
			res.json({
				success: true,
				msg: 'token refreshed successfully'
			});

		} else {
			res.status(401).json({ success: false, message: 'Unauthorized' });
		}
	} catch (error) {
		return res.json({ success: false, message: 'failed to refresh token' })
	}
});

router.get('/login/failed', (_req: Request, res: Response) => {
	res.status(401).json({ success: false, msg: 'failed to login' });
});

router.get('/logout', (req: Request, res: Response) => {
	res.clearCookie('guest', cookieConfig);
	req.logout((err) => {
		if (err) {
			console.error('Error logging out:', err);
			res.status(500).json({ error: 'Failed to log out' });
		} else {
			res.clearCookie('jwt', cookieConfig);
			res.redirect(CLIENT);
		}
	});
});

router.get(
	'/google',
	passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
	'/google/callback',
	passport.authenticate('google', {
		successRedirect: CLIENT_URL,
		failureRedirect: '/auth/login/failed',
	}),
);

router.get(
	'/github',
	passport.authenticate('github', { scope: ['read:user', 'user:email'] }),
);

router.get(
	'/github/callback',
	passport.authenticate('github', {
		successRedirect: CLIENT_URL,
		failureRedirect: '/auth/login/failed',
	}),
);

export default router;
