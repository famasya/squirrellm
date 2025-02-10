import useChatStore from "~/lib/stores";
import ChatBubble from "./chat-bubble";

export default function ChatRoute() {
	const { messages } = useChatStore();

	return (
		<>
			<div className="flex flex-col markdown-content">
				{messages.map((message) => {
					return (
						<ChatBubble
							key={message.id}
							text={message.content}
							isBot={message.role === "assistant"}
						/>
					);
				})}
			</div>
		</>
	);
}
