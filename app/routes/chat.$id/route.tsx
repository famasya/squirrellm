import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { type Message, useChat } from "ai/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GlobalErrorBoundary } from "~/components/global-error-boundary";
import useChatStore from "~/lib/stores";
import { useEffectOnce } from "~/lib/utils";
import { commitSession, getSession } from "~/sessions";
import type { ChatPayload, MessageStatus } from "../api.chat";
import AppChatbox from "./app-chatbox";
import { loadMessages } from "./loader";
import MessagesRenderer from "./messages-renderer";

export async function loader({ request, params }: LoaderFunctionArgs) {
	if (!params.id) {
		throw new Response(null, { statusText: "Chat Not Found", status: 404 });
	}

	const session = await getSession(request.headers.get("Cookie"));
	const newConversation = session.get("newConversation");
	const data = await loadMessages({
		conversationId: params.id,
		newConversation,
	});

	return Response.json(data, {
		headers: {
			"Set-Cookie": await commitSession(session),
		},
	});
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{
			title: data?.pageTitle || "Squirrellm",
		},
	];
};

export default function ChatLayout() {
	const {
		profile,
		availableProfiles,
		conversationId,
		previousMessages,
		newConversation,
	} = useLoaderData<typeof loadMessages>();
	const initializeChat = useRef(false);

	// set to default profile
	const [selectedProfile, selectProfile] = useState<typeof profile>(profile);

	const {
		messages,
		input,
		data,
		stop,
		setData,
		append,
		reload,
		setMessages,
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
				annotations: [{ model: message.model, isSent: message.sent }],
				createdAt: new Date(message.createdAt),
			};
		}),
		experimental_prepareRequestBody: ({ messages }) => {
			// send last message only to reduce payload
			const payload: ChatPayload = {
				message: {
					...messages[messages.length - 1],
					modelId: selectedProfile.modelId,
					profileId: selectedProfile.id,
					conversationId: conversationId,
					instruction: selectedProfile.systemMessage,
					temperature: selectedProfile.temperature,
				},
			};
			return payload;
		},
		onError: (error) => {
			console.error(error);
			toast.error(error.message);
		},
	});
	const { setMessageStatus } = useChatStore();

	// set message status based on stream
	useEffect(() => {
		const lastStatus = data?.pop();
		if (lastStatus) {
			const status = JSON.parse(lastStatus as string) as MessageStatus;
			setMessageStatus(status.status === "done" ? null : status);
		}
	}, [data, setMessageStatus]);

	// if this is a new conversation, execute initial message
	useEffectOnce(() => {
		if (!initializeChat.current) {
			if (newConversation) {
				append({
					content: newConversation.message,
					role: "user",
					id: TwitterSnowflake.generate().toString(),
					createdAt: new Date(),
				});
			}
			initializeChat.current = true;
		}
	});

	return (
		<div className="w-full flex flex-col h-full overflow-hidden">
			<MessagesRenderer
				retryAction={(id) => {
					setData(undefined);
					// modify message in client side
					setMessages((messages) => {
						return messages.map((message) => {
							if (message.id === id) {
								return {
									...message,
									annotations: [
										{
											model: selectedProfile.modelId,
											isSent: true,
										},
									],
								};
							}
							return message;
						});
					});
					reload();
				}}
				messages={messages}
				selectedModel={selectedProfile.modelId}
			/>

			<AppChatbox
				id={conversationId}
				stop={() => {
					setData(undefined);
					stop();
				}}
				handleInputChange={handleInputChange}
				handleSend={() => {
					setData(undefined);
					handleSubmit();
				}}
				handleProfileChange={(
					profileId,
					modelId,
					temperature,
					systemMessage,
				) => {
					selectProfile({
						...selectedProfile,
						id: profileId,
						modelId: modelId,
						temperature: temperature,
						systemMessage: systemMessage,
					});
				}}
				input={input}
				availableProfiles={availableProfiles}
				selectedProfile={selectedProfile?.id}
			/>
		</div>
	);
}

export function ErrorBoundary() {
	return <GlobalErrorBoundary />;
}
