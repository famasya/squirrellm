import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ActionFunctionArgs } from "@remix-run/node";
import { streamText } from "ai";
import { any, object, parse } from "valibot";

export const chatApiSchema = object({
  messages: any(),
});
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { messages } = parse(chatApiSchema, body);

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const result = streamText({
      model: openrouter("google/gemini-2.0-flash-lite-preview-02-05:free"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (e) {
    return Response.json({ error: e }, { status: 400 });
  }
}
