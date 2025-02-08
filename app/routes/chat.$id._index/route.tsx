import ChatBubble from "~/components/chat-bubble";
import useChatStore from "~/lib/stores";

export default function AppRoute() {
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
