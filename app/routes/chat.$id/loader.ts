import { redirect } from "@remix-run/node";
import { type InferSelectModel, eq } from "drizzle-orm";
import { db, redis } from "~/lib/db";
import { messages as messagesTable, profiles } from "~/lib/db.schema";
import type { SessionFlashData } from "~/sessions";
type Params = {
	conversationId: string;
	newConversation?: SessionFlashData["newConversation"];
};

type Profile = InferSelectModel<typeof profiles>;
export const loadMessages = async ({
	conversationId,
	newConversation,
}: Params) => {
	const messages = await db
		.select()
		.from(messagesTable)
		.where(eq(messagesTable.conversationId, conversationId));

	// if neither messages or conversation is present, redirect to home
	if (!messages.length && !newConversation) {
		return redirect("/");
	}

	// find profile from new conversation or last used message
	const availableProfiles = await db.select().from(profiles);
	const lastMessage = messages[messages.length - 1] as
		| (typeof messages)[0]
		| undefined;
	let profile = availableProfiles.find((p) => {
		if (!lastMessage) {
			return p.id === newConversation?.profileId;
		}
		return p.id === lastMessage?.profileId;
	});

	// if no profile found, select default. default profile must be present since minimum 1 profile is required for the app to work.
	if (!profile) {
		profile = availableProfiles.find((p) => p.isDefault === 1) as Profile;
	}

	// cache messages to redis for 1 hour
	await redis.set(conversationId, JSON.stringify(messages), "EX", 3600);

	return {
		previousMessages: messages,
		pageTitle: messages[0]?.content || newConversation?.message,
		profile: profile,
		newConversation,
		conversationId,
		availableProfiles,
	};
};
