import type { LoaderFunctionArgs } from "@remix-run/node";
import {
	Outlet,
	isRouteErrorResponse,
	useLoaderData,
	useLocation,
	useRouteError,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { ScrollArea } from "~/components/ui/scroll-area";
import { db } from "~/lib/db";
import { messages as messagesTable, models, sessions } from "~/lib/db.schema";
import AppChatbox from "./app-chatbox";

export async function loader({ params }: LoaderFunctionArgs) {
	if (!params.id) {
		throw new Response(null, { statusText: "Chat Not Found", status: 404 });
	}

	const session = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, params.id));
	if (session.length === 0) {
		throw new Response(null, { statusText: "Chat Not Found", status: 404 });
	}

	const messages = await db
		.select()
		.from(messagesTable)
		.where(eq(messagesTable.sessionId, params.id));

	const availableModels = await db.select().from(models);

	// set the model to the last used model
	const model = messages[messages.length - 1]?.model || null;
	return { messages, model, sessionId: params.id, availableModels };
}

export default function ChatLayout() {
	const { messages, model, sessionId, availableModels } =
		useLoaderData<typeof loader>();

	const location = useLocation();
	const initialMessage = location.state?.initialMessage;
	const initialModel = location.state?.initialModel;

	return (
		<div className="w-full flex flex-col h-full overflow-hidden">
			<div className="px-3 pt-2 flex-1 overflow-auto">
				<ScrollArea className="h-full overflow-y-auto pr-4">
					<Outlet />
				</ScrollArea>
			</div>
			<AppChatbox
				availableModels={availableModels}
				storedMessages={messages.map((message) => ({
					id: message.id,
					content: message.content,
					role: message.role,
					createdAt: new Date(message.createdAt),
				}))}
				initialMessage={initialMessage}
				model={model || initialModel}
				sessionId={sessionId}
			/>
		</div>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	if (isRouteErrorResponse(error)) {
		return (
			<div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
				<div className="text-red-400">{error.statusText}</div>
			</div>
		);
	}

	if (error instanceof Error) {
		return (
			<div className="border border-red-400 p-2 rounded mt-6 bg-white/10">
				<div className="text-red-400">{error.message}</div>
			</div>
		);
	}

	return <>Unknown Error</>;
}
