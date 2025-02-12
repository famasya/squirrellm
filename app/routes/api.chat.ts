import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
	type Message,
	createDataStreamResponse,
	extractReasoningMiddleware,
	smoothStream,
	streamText,
	wrapLanguageModel,
} from "ai";
import { db, redis } from "~/lib/db";
import { messages as messagesTable } from "~/lib/db.schema";

export type ChatPayload = {
	message: Message & {
		modelId: string;
		instruction: string | null;
		conversationId: string;
		temperature: string;
	};
};
export async function action({ request }: ActionFunctionArgs) {
	try {
		const { message } = (await request.json()) as ChatPayload;
		if (!message) {
			throw new Error("Messages are required");
		}
		const { modelId, instruction, conversationId, temperature } = message;

		const openrouter = createOpenRouter({
			apiKey: process.env.OPENROUTER_API_KEY,
		});

		// append cached messages to current message
		const cachedMessages = JSON.parse(
			(await redis.get(conversationId)) || "[]",
		);
		const messages = [...cachedMessages, message];
		await db
			.insert(messagesTable)
			.values({
				id: message.id,
				role: "user",
				createdAt: new Date().getTime(),
				content: message.content,
				model: modelId,
				conversationId: conversationId,
			})
			.onConflictDoNothing();

		// get instruction from header
		return createDataStreamResponse({
			execute: (dataStream) => {
				dataStream.writeData("<thinking>");

				const aiModel = wrapLanguageModel({
					model: openrouter(modelId, {
						includeReasoning: true,
					}),
					middleware: extractReasoningMiddleware({ tagName: "think" }),
				});
				const result = streamText({
					model: aiModel,
					abortSignal: request.signal,
					experimental_continueSteps: true,
					maxSteps: 5,
					temperature: Number.parseFloat(temperature),
					messages,
					...(instruction && { system: instruction }),
					onChunk: (chunk) => {
						dataStream.writeMessageAnnotation({ model: modelId });
					},
					onFinish: async (response) => {
						// once stream is closed, store the messages
						if (response.finishReason === "stop") {
							await db
								.insert(messagesTable)
								.values({
									id: response.response.id,
									role: "assistant",
									createdAt: new Date().getTime(),
									content: response.text,
									model: modelId,
									promptToken: response.usage.promptTokens,
									completionToken: response.usage.completionTokens,
									totalToken: response.usage.totalTokens,
									reasoning: response.reasoning,
									conversationId: conversationId,
								})
								.onConflictDoNothing();
						}

						dataStream.writeData("<done>");
					},
					experimental_transform: smoothStream({
						delayInMs: 50,
					}),
				});

				result.mergeIntoDataStream(dataStream, {
					sendUsage: true,
					sendReasoning: true,
				});
			},
			onError: (error) => {
				return error instanceof Error ? error.message : String(error);
			},
		});
	} catch (e) {
		if (e instanceof Error) {
			return Response.json({ error: e.message }, { status: 500 });
		}
		return Response.json({ error: String(e) }, { status: 500 });
	}
}
