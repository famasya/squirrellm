import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ActionFunctionArgs } from "@remix-run/node";
import { type Message, streamText } from "ai";
import { db } from "~/lib/db";
import { messages as messagesTable } from "~/lib/db.schema";

export async function action({ request }: ActionFunctionArgs) {
	try {
		const url = new URL(request.url).searchParams;
		const model = url.get("model");
		const sessionId = url.get("sessionId");
		const { messages } = await request.json();
		if (!messages || !model || !sessionId) {
			throw new Error("Messages are required");
		}

		const openrouter = createOpenRouter({
			apiKey: process.env.OPENROUTER_API_KEY,
		});

		// add user message to messages (from latest message)
		console.log(messages, 321);
		const message = messages[messages.length - 1] as Message;
		await db
			.insert(messagesTable)
			.values({
				id: message.id,
				role: "user",
				createdAt: new Date().getTime(),
				content: message.content,
				model: model,
				sessionId: sessionId,
			})
			.onConflictDoNothing();

		const result = streamText({
			model: openrouter(model),
			messages,
			onFinish: async (response) => {
				// once stream is closed, store the messages
				await db
					.insert(messagesTable)
					.values({
						id: response.response.id,
						role: "assistant",
						createdAt: new Date().getTime(),
						content: response.text,
						model: model,
						promptToken: response.usage.promptTokens,
						completionToken: response.usage.completionTokens,
						totalToken: response.usage.totalTokens,
						reasoning: response.reasoning,
						sessionId: sessionId,
					})
					.onConflictDoNothing();
			},
		});

		return result.toDataStreamResponse();
	} catch (e) {
		const err = e as unknown as Error;
		return Response.json({ error: err.message }, { status: 400 });
	}
}
