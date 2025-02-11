import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { type Message, useChat } from "ai/react";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GlobalErrorBoundary } from "~/components/global-error-boundary";
import { ScrollArea } from "~/components/ui/scroll-area";
import { db, redis } from "~/lib/db";
import {
	conversations,
	messages as messagesTable,
	models,
} from "~/lib/db.schema";
import useChatStore from "~/lib/stores";
import { cn, useEffectOnce } from "~/lib/utils";
import { getSession } from "~/sessions";
import type { ChatPayload } from "../api.chat";
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
		.where(eq(messagesTable.conversationId, params.id));

	// if neither messages or conversation is present, redirect to home
	if (!messages.length || !conversation) {
		return redirect("/");
	}
	const pageTitle = messages[0]?.content || conversation.message;

	// find model from chat initialization or last message
	const availableModels = await db.select().from(models);
	const lastMessage = messages[messages.length - 1];
	const messageModel = availableModels.find(
		(m) => m.id === lastMessage?.model || conversation?.model,
	);

	// if model not found, redirect to home
	if (!messageModel) {
		return redirect("/");
	}

	// store messages to redis for 1 hour
	await redis.set(params.id, JSON.stringify(messages), "EX", 3600);

	return {
		previousMessages: messages,
		pageTitle: pageTitle,
		model: messageModel.id,
		temperature: messageModel.temperature,
		conversationId: params.id,
		availableModels,
		newConversationMessage: conversation?.message,
		newConversationModelInstruction: conversation?.instruction,
	};
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: data?.pageTitle || "OpenRouter Chat",
		},
	];
};

export default function ChatLayout() {
	const {
		previousMessages,
		model,
		conversationId,
		availableModels,
		newConversationMessage,
		newConversationModelInstruction,
	} = useLoaderData<typeof loader>();
	const initializeChat = useRef(false);

	const lastModelInstruction =
		availableModels.find((m) => m.id === model)?.systemMessage || undefined;
	const [selectedModel, selectModel] = useState<{
		model: string;
		instruction?: string;
	}>({
		model: model,
		instruction: newConversationModelInstruction || lastModelInstruction,
	});

	const {
		messages,
		input,
		isLoading,
		data,
		stop,
		setData,
		append,
		handleInputChange,
		handleSubmit,
	} = useChat({
		sendExtraMessageFields: true,
		initialMessages: previousMessages.map((message) => {
			const parts: Message["parts"] = [
				{
					type: "text",
					text: message.content,
				},
			];

			if (message.reasoning) {
				parts.push({
					type: "reasoning",
					reasoning: message.reasoning,
				});
			}

			return {
				content: message.content,
				role: message.role as "assistant" | "user",
				id: message.id,
				parts: parts,
				annotations: [{ model: message.model }],
				createdAt: new Date(message.createdAt),
			};
		}),
		experimental_prepareRequestBody: ({ messages }) => {
			// send last message only to reduce payload
			const payload: ChatPayload = {
				message: {
					...messages[messages.length - 1],
					model: selectedModel.model,
					conversationId: conversationId,
					instruction: selectedModel.instruction,
					temperature: "1",
				},
			};
			return payload;
		},
		onError: (error) => {
			console.error(error);
			toast.error(error.message);
		},
	});
	const { setIsGeneratingResponse } = useChatStore();

	useEffect(() => {
		setIsGeneratingResponse(isLoading);
	}, [isLoading, setIsGeneratingResponse]);

	console.log(messages);
	// update model and instruction when model changes
	useEffect(() => {
		const lastModelInstruction =
			availableModels.find((m) => m.id === model)?.systemMessage || undefined;

		selectModel({
			model: model,
			instruction: newConversationModelInstruction || lastModelInstruction,
		});
	}, [model, newConversationModelInstruction, availableModels]);

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
	// scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0) {
			const scrollToBottom = () => {
				if (lastMessageRef.current) {
					lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
				}
			};
			scrollToBottom();

			// Also scroll when messages are still streaming
			const timer = setTimeout(scrollToBottom, 500);
			return () => clearTimeout(timer);
		}
	}, [messages]);

	return (
		<div className="w-full flex flex-col h-full overflow-hidden">
			<div className="px-3 pt-2 flex-1 overflow-auto" ref={scrollRef}>
				<ScrollArea className="h-full overflow-y-auto pr-4" type="always">
					<div className="min-h-[100%]">
						<div className="text-center text-gray-500 text-sm">
							Conversation begins at{" "}
							{format(messages[0]?.createdAt || Date.now(), "dd/MM/yy HH:mm")}
						</div>
						{messages.map((message, index) => {
							const messageModelUsed = message.annotations?.[0] as
								| undefined
								| { model: string };
							const isLastMessage = index === messages.length - 1;
							const nowThinking =
								data?.includes("<thinking>") &&
								!data.includes("<done>") &&
								isLastMessage;
							return (
								<div key={message.id} className={cn(isLastMessage && "mb-8")}>
									<ChatBubble
										isThinking={nowThinking}
										model={messageModelUsed?.model || selectedModel.model}
										isBot={message.role === "assistant"}
										message={message}
									/>
								</div>
							);
						})}
						{/* Add an empty div at the bottom as scroll target */}
						<div ref={lastMessageRef} className="h-1" />
					</div>
				</ScrollArea>
			</div>

			<AppChatbox
				id={conversationId}
				scrollToBottom={() => {
					if (lastMessageRef.current) {
						lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
					}
				}}
				stop={() => {
					setData(undefined);
					stop();
				}}
				handleInputChange={handleInputChange}
				handleSend={() => {
					setData(undefined);
					handleSubmit();
				}}
				handleModelChange={(model, instruction) => {
					selectModel({ model, instruction });
				}}
				input={input}
				isLoading={isLoading}
				availableModels={availableModels}
				selectedModel={selectedModel.model}
			/>
		</div>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
