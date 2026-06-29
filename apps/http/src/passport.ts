import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from "passport-google-oauth20";
import { Strategy as GithubStrategy, type Profile as GithubProfile } from "passport-github2";
import passport from 'passport';
import dotenv from 'dotenv';
import db from './db';

interface GithubEmailRes {
	email: string;
	primary: boolean;
	verified: boolean;
	visibility: 'private' | 'public';
}

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
	throw new Error('Google client ID and secret must be set in environment variables');
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
	throw new Error('GitHub client ID and secret must be set in environment variables');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;


export function initPassport() {
	passport.use(
		new GoogleStrategy(
			{
				clientID: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				callbackURL: '/auth/google/callback',
			},
			async function(
				_accessToken: string,
				_refreshToken: string,
				profile: GoogleProfile,
				done: (error: any, user?: any) => void,
			) {
				try {
					const email = profile.emails?.[0]?.value;
					if (!email) return done(new Error("No email returned by Google"));

					const user = await db.user.upsert({
						create: {
							username: `${email.split("@")[0]}_${Math.floor(1000 + Math.random() * 9000)}`,
							email: email,
							name: profile.displayName,
							provider: 'GOOGLE',
						},
						update: {
							name: profile.displayName,
							provider: 'GOOGLE',
						},
						where: {
							email: email,
						},
					});

					done(null, user);
				} catch (error) {
					done(error);
				}
			},
		),
	);

	passport.use(
		new GithubStrategy(
			{
				clientID: GITHUB_CLIENT_ID,
				clientSecret: GITHUB_CLIENT_SECRET,
				callbackURL: '/auth/github/callback',
			},
			async function(
				accessToken: string,
				_refreshToken: string,
				profile: GithubProfile,
				done: (error: any, user?: any) => void,
			) {
				try {
					const res = await fetch('https://api.github.com/user/emails', {
						headers: {
							Authorization: `token ${accessToken}`,
						},
					});
					if (!res.ok) {
						return done(new Error("Failed to fetch GitHub emails"));
					}
					const data = await res.json() as GithubEmailRes[];
					const primaryEmail = data.find((item) => item.primary === true);
					if (!primaryEmail) return done(new Error("No primary email found for GitHub user"));

					const email = primaryEmail.email;

					const user = await db.user.upsert({
						create: {
							username: `${email.split("@")[0]}_${Math.floor(1000 + Math.random() * 9000)}`,
							email,
							name: profile.displayName,
							provider: 'GITHUB',
						},
						update: {
							name: profile.displayName,
							provider: 'GITHUB',
						},
						where: {
							email
						},
					});

					done(null, user);
				} catch (error) {
					done(error);
				}
			},
		),
	);

	passport.serializeUser(function(user: any, done) {
		return done(null, user.id);
	});

	passport.deserializeUser(async function(id: string, done) {
		try {
			const user = await db.user.findUnique({ where: { id } });
			return done(null, user);
		} catch (error) {
			done(error);
		}
	});
}
