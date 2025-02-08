import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import AppChatbox from "~/components/app-chatbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { db } from "~/lib/db";
import { messages as messagesTable, models } from "~/lib/db.schema";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, params.id));

  const availableModels = await db.select().from(models);

  // set the model to the last used model
  const model = messages[messages.length - 1]?.model;
  return { messages, model, sessionId: params.id, availableModels };
}

export default function AppLayout() {
  const { messages, model, sessionId, availableModels } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex-1">
        <ScrollArea className="h-full overflow-y-auto mr-2">
          <Outlet />
        </ScrollArea>
      </div>
      <AppChatbox
        availableModels={availableModels}
        initialMessages={messages.map((message) => ({
          id: message.id,
          content: message.content,
          role: message.role,
          createdAt: new Date(message.createdAt),
        }))}
        model={model}
        sessionId={sessionId}
      />
    </div>
  );
}
