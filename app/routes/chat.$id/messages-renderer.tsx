import type { UseChatHelpers } from "ai/react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import ChatBubble from "./chat-bubble";
import type { FailedMessage } from "./route";

type Props = {
	messages: UseChatHelpers["messages"];
	selectedModel: string;
	retryAction: () => void;
	failedMessage?: FailedMessage;
};
export default function MessagesRenderer({
	messages,
	selectedModel,
	retryAction,
	failedMessage,
}: Props) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const lastMessageRef = useRef<HTMLDivElement>(null);

	// scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0) {
			const scrollToBottom = () => {
				if (lastMessageRef.current) {
					lastMessageRef.current.scrollIntoView({ behavior: "instant" });
				}
			};
			scrollToBottom();

			// Also scroll when messages are still streaming
			const timer = setTimeout(scrollToBottom, 500);
			return () => clearTimeout(timer);
		}
	}, [messages]);

	return (
		<>
			<div className="absolute bottom-28 w-full px-2">
				<div
					className={cn(
						"text-right mb-1 text-sm bg-red-800 px-4 py-1 rounded",
						!failedMessage && "hidden",
					)}
				>
					Last message was failed.{" "}
					<Button
						className="h-4 px-4 py-3 text-sm bg-white/20 hover:bg-white/30"
						variant={"destructive"}
						onClick={retryAction}
					>
						Retry?
					</Button>
				</div>
			</div>
			<div
				className="px-0 pr-2 md:px-3 pt-2 flex-1 overflow-auto"
				ref={scrollRef}
			>
				<div className="min-h-[100%]">
					<div className="text-center text-gray-500 pt-2 text-sm">
						<span className="bg-white/5 px-2 py-1 rounded-full">
							Conversation begins at{" "}
							{format(messages[0]?.createdAt || Date.now(), "dd/MM/yy HH:mm")}
						</span>
					</div>
					{messages.map((message, index) => {
						const messageModelUsed = message.annotations?.[0] as
							| undefined
							| { model: string };
						const isLastMessage = index === messages.length - 1;

						return (
							<div
								key={message.id}
								className={cn(
									isLastMessage && "mb-8",
									isLastMessage && failedMessage && "mb-12",
								)}
							>
								<ChatBubble
									regenerate={retryAction}
									model={messageModelUsed?.model || selectedModel}
									isBot={message.role === "assistant"}
									message={message}
									isLastMessage={isLastMessage}
								/>
							</div>
						);
					})}
					{/* Add an empty div at the bottom as scroll target */}
					<div ref={lastMessageRef} className="h-1" />
				</div>
			</div>
		</>
	);
}
