import type { LoaderFunctionArgs } from "@remix-run/node";
import {
	isRouteErrorResponse,
	redirect,
	useLoaderData,
	useRouteError,
} from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { useChat } from "ai/react";
import { eq } from "drizzle-orm";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ScrollArea } from "~/components/ui/scroll-area";
import { db } from "~/lib/db";
import {
	conversations,
	messages as messagesTable,
	models,
} from "~/lib/db.schema";
import { useEffectOnce } from "~/lib/utils";
import { getSession } from "~/sessions";
import AppChatbox from "./app-chatbox";
import ChatBubble from "./chat-bubble";

export async function loader({ request, params }: LoaderFunctionArgs) {
	if (!params.id) {
		throw new Response(null, { statusText: "Chat Not Found", status: 404 });
	}

	const sessionStorage = await getSession(request.headers.get("Cookie"));
	const conversation = sessionStorage.get("newConversation");
	const session = await db
		.select()
		.from(conversations)
		.where(eq(conversations.id, params.id));
	if (session.length === 0) {
		throw new Response(null, { statusText: "Chat Not Found", status: 404 });
	}

	const messages = await db
		.select()
		.from(messagesTable)
		.where(eq(messagesTable.sessionId, params.id));

	const availableModels = await db.select().from(models);

	// set the model to the last used model
	const model = messages[messages.length - 1]?.model || conversation?.model;
	if (!model) {
		return redirect("/settings?state=onboarding");
	}

	return {
		previousMessages: messages,
		model,
		sessionId: params.id,
		availableModels,
		newConversationMessage: conversation?.message,
	};
}

export default function ChatLayout() {
	const {
		previousMessages,
		model,
		sessionId,
		availableModels,
		newConversationMessage,
	} = useLoaderData<typeof loader>();
	const initializeChat = useRef(false);

	const {
		messages,
		input,
		isLoading,
		append,
		handleInputChange,
		handleSubmit,
	} = useChat({
		api: `/api/chat?sessionId=${sessionId}&model=${model}`,
		sendExtraMessageFields: true,
		initialMessages: previousMessages.map((message) => ({
			content: message.content,
			role: message.role as "assistant" | "user",
			id: message.id,
			createdAt: new Date(message.createdAt),
		})),
		onError: (error) => {
			console.log(error);
			toast.error(error.message);
		},
	});

	// if this is a new conversation, execute initial message
	useEffectOnce(() => {
		if (!initializeChat.current) {
			if (newConversationMessage) {
				append({
					content: newConversationMessage,
					role: "user",
					id: TwitterSnowflake.generate().toString(),
					createdAt: new Date(),
				});
			}
			initializeChat.current = true;
		}
	});
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastMessageRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (messages.length > 0) {
			// Function to scroll to bottom
			const scrollToBottom = () => {
				if (lastMessageRef.current) {
					lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
				}
			};

			scrollToBottom();

			// Also scroll when messages are still streaming
			const timer = setTimeout(scrollToBottom, 100);

			return () => clearTimeout(timer);
		}
	}, [messages]); // Re-run when messages change

	return (
		<div className="w-full flex flex-col h-full overflow-hidden">
			<div className="px-3 pt-2 flex-1 overflow-auto" ref={scrollRef}>
				<ScrollArea className="h-full overflow-y-auto pr-4">
					{messages.map((message, index) => (
						<div
							key={message.id}
							ref={index === messages.length - 1 ? lastMessageRef : null}
						>
							<ChatBubble
								key={message.id}
								text={message.content}
								isBot={message.role === "assistant"}
							/>
						</div>
					))}
				</ScrollArea>
			</div>

			<AppChatbox
				handleInputChange={handleInputChange}
				handleSend={handleSubmit}
				input={input}
				isLoading={isLoading}
				availableModels={availableModels}
				lastUsedModel={model}
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

	return <div>Unknown Error</div>;
}
