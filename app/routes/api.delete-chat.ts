import type { ActionFunctionArgs } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { db } from "~/lib/db";
import { sessions } from "~/lib/db.schema";

export async function action({ request }: ActionFunctionArgs) {
	const { id } = await request.json();
	if (!id) throw new Error("ID is required");
	await db.delete(sessions).where(eq(sessions.id, id as string));
	return Response.json({ status: "ok" });
}
