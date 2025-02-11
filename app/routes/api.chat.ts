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

		// get instruction from header
		const headers = new Headers(request.headers);
		const instruction = headers.get("model-instruction");
		return createDataStreamResponse({
			execute: (dataStream) => {
				dataStream.writeData("<thinking>");

				const aiModel = wrapLanguageModel({
					model: openrouter(model, {
						includeReasoning: true,
					}),
					middleware: extractReasoningMiddleware({ tagName: "think" }),
				});
				const result = streamText({
					model: aiModel,
					abortSignal: request.signal,
					messages,
					...(instruction && { system: instruction }),
					onChunk: (chunk) => {
						dataStream.writeMessageAnnotation({ model: model });
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
									model: model,
									promptToken: response.usage.promptTokens,
									completionToken: response.usage.completionTokens,
									totalToken: response.usage.totalTokens,
									reasoning: response.reasoning,
									sessionId: sessionId,
								})
								.onConflictDoNothing();
						}

						dataStream.writeData("<done>");
					},
					experimental_transform: smoothStream({
						delayInMs: 20,
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
