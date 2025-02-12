import type { JSONValue } from "ai";
import type { UseChatHelpers } from "ai/react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import ChatBubble from "./chat-bubble";

type Props = {
	messages: UseChatHelpers["messages"];
	data?: JSONValue[];
	selectedModel: string;
};
export default function MessagesRenderer({
	messages,
	data,
	selectedModel,
}: Props) {
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
		<>
			<div className="px-3 pt-2 flex-1 overflow-auto" ref={scrollRef}>
				<ScrollArea className="h-full overflow-y-auto pr-4" type="always">
					<div className="min-h-[100%]">
						<div className="text-center text-gray-500 mt-2 text-sm">
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
							const nowThinking =
								data?.includes("<thinking>") &&
								!data.includes("<done>") &&
								isLastMessage;
							return (
								<div key={message.id} className={cn(isLastMessage && "mb-8")}>
									<ChatBubble
										isThinking={nowThinking}
										model={messageModelUsed?.model || selectedModel}
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
		</>
	);
}
