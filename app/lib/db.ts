import { drizzle } from "drizzle-orm/libsql";
import Redis from "ioredis";

export const db = drizzle({
	connection: {
		url: process.env.DATABASE_URL as string,
		authToken: process.env.DATABASE_AUTH_TOKEN as string,
	},
});

export const redis = new Redis(process.env.REDIS_URL || "");
