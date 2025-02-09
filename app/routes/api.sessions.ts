import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { desc, lt } from "drizzle-orm";
import { db } from "~/lib/db";
import { sessions } from "~/lib/db.schema";

const LIMIT = 10;

export async function loader(args: LoaderFunctionArgs) {
	const user = await getAuth(args);
	if (!user) {
		throw new Response("Unauthorized", { status: 401 });
	}

	const { request } = args;
	const params = new URL(request.url).searchParams;
	// cursor based pagination
	const cursor = params.get("cursor");
	if (cursor) {
		const data = await db
			.select()
			.from(sessions)
			.where(lt(sessions.createdAt, cursor))
			.orderBy(desc(sessions.createdAt))
			.limit(LIMIT + 1);
		console.log(cursor);

		const hasMore = data.length > LIMIT;
		if (hasMore) {
			data.pop();
		}

		return Response.json({
			sessions: data,
			cursor: hasMore ? data[data.length - 1].createdAt : null,
		});
	}

	const data = await db
		.select()
		.from(sessions)
		.orderBy(desc(sessions.createdAt))
		.limit(LIMIT + 1);

	const hasMore = data.length > LIMIT;
	if (hasMore) {
		data.pop();
	}

	return Response.json({
		sessions: data,
		cursor: hasMore ? data[data.length - 1].createdAt : null,
	});
}
