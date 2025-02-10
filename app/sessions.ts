import { createCookieSessionStorage } from "@remix-run/node";

type SessionData = {
	userId: string;
};

type SessionFlashData = {
	newConversation: {
		message: string;
		model: string;
		instruction?: string;
	};
};

const { getSession, commitSession, destroySession } =
	createCookieSessionStorage<SessionData, SessionFlashData>({
		// a Cookie from `createCookie` or the CookieOptions to create one
		cookie: {
			name: "__session",
			secrets: [process.env.SESSION_SECRET as string],
		},
	});

export { commitSession, destroySession, getSession };
