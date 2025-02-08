import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ActionFunctionArgs } from "@remix-run/node";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { streamText } from "ai";
import { db } from "~/lib/db";
import { messages as messagesTable } from "~/lib/db.schema";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { messages, sessionId, model } = await request.json();
    if (!sessionId || !model) {
      throw new Error("Session id and model are required");
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const result = streamText({
      model: openrouter(model),
      messages,
      onFinish: (response) => {
        // once stream is closed, store the messages        
        db.insert(messagesTable).values({
          id: TwitterSnowflake.generate().toString(),
          role: "assistant",
          createdAt: new Date().getTime(),
          content: response.text,
          model: model,
          promptToken: response.usage.promptTokens,
          completionToken: response.usage.completionTokens,
          totalToken: response.usage.totalTokens,
          reasoning: response.reasoning,
          sessionId: sessionId
        })
      }
    });

    return result.toDataStreamResponse();
  } catch (e) {
    return Response.json({ error: e }, { status: 400 });
  }
}
