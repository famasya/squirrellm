import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, redirect, useLoaderData, useNavigation } from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { Loader2, Send, Squirrel } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { SearchableSelect } from "~/components/ui/searchable-select";
import { db } from "~/lib/db";
import { messages, models as modelsTable, sessions } from "~/lib/db.schema";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const message = body.get("message");
  const model = body.get("model");
  if (!message || !model) throw new Error("Message is required");

  const id = TwitterSnowflake.generate().toString();

  // create session
  await db.insert(sessions).values({
    id: id,
    createdAt: new Date().toISOString(),
    name: message as string,
  });

  // insert first message
  const messageId = TwitterSnowflake.generate().toString();
  await db.insert(messages).values({
    id: messageId,
    role: "user",
    createdAt: new Date().getTime(),
    content: message as string,
    model: model as string,
    sessionId: id,
  });

  return redirect(`/chat/${id}`);
}

export async function loader() {
  const models = await db.select().from(modelsTable);
  if (models.length === 0) {
    return redirect("/settings");
  }
  return { models };
}

export default function AppHome() {
  const [message, setMessage] = useState("");
  const navigation = useNavigation();
  const { models } = useLoaderData<typeof loader>();

  const defaultModel = models.find((model) => model.isDefault === 1);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-[800px] space-y-2 flex flex-col text-center">
        <h1 className="text-xl font-semibold mb-2 flex items-center justify-center gap-4"><Squirrel />How may I help you?</h1>
        <Form method="post">
          <Input
            placeholder="Ask me anything..."
            value={message}
            name="message"
            disabled={navigation.state === "submitting" || models.length === 0}
            onChange={(e) => setMessage(e.target.value)}
            className="h-12 rounded-xl shadow-lg dark:bg-zinc-800"
            autoFocus
          />

          <div className="w-full flex justify-between mt-2">
            <div className="flex gap-2 items-center">
              <SearchableSelect
                disabled={
                  navigation.state === "submitting" || models.length === 0
                }
                value={defaultModel?.id}
                options={models.map((model) => ({
                  value: model.id,
                  label: model.name,
                }))}
                placeholder="Select a model"
              />
            </div>
            <Input
              type="hidden"
              name="model"
              value={defaultModel?.id}
            />

            <Button
              type="submit"
              disabled={
                navigation.state === "submitting" || models.length === 0
              }
            >
              {navigation.state === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <Send /> Send
                </>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
