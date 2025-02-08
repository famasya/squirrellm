import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import AppChatbox from "~/components/app-chatbox";
import { ScrollArea } from "~/components/ui/scroll-area";
import { db } from "~/lib/db";
import { messages as messagesTable } from "~/lib/db.schema";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, params.id));
  return { messages };
}

export default function AppLayout() {
  const { messages } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 flex-1">
        <ScrollArea className="h-full overflow-y-auto mr-2">
          <Outlet />
        </ScrollArea>
      </div>
      <AppChatbox initialMessages={messages.map((message) => ({ ...message, synced: true }))} />
    </div>
  );
}
