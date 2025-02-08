import { useChat } from "ai/react";
import { Loader2, Send } from "lucide-react";
import { useEffect } from "react";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import useChatStore from "~/lib/stores";
import { cn } from "~/lib/utils";

type Props = {
  initialMessages: { id: string; content: string; role: string; createdAt: Date }[];
  model: string;
  availableModels: { id: string; name: string }[];
  sessionId: string;
};

export default function AppChatbox({
  initialMessages,
  model,
  availableModels,
  sessionId,
}: Props) {
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    append,
    setMessages: setChatMessages
  } = useChat({
    body: {
      model: model,
      sessionId: sessionId,
    }
  });
  const { setMessages } = useChatStore();

  const handleSend = () => {
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        content: input,
        role: "user",
      },
    ]);
    handleSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // store messages to store
    setMessages(messages.map((message) => ({ ...message })));
  }, [messages, setMessages]);


  // handle initial messages
  useEffect(() => {
    if (initialMessages.length === 1) {
      // auto send the first message
      append({
        content: initialMessages[0].content,
        role: "user",
      });
    } else {
      // otherwise, set the messages and also convert them to chat messages
      setMessages(initialMessages.map((message) => ({
        content: message.content,
        role: message.role as "assistant" | "user",
        id: message.id
      })));
      setChatMessages(initialMessages.map((message) => ({
        content: message.content,
        role: message.role as "assistant" | "user",
        id: message.id,
        createdAt: message.createdAt
      })))
    }
  }, [initialMessages, append, setMessages, setChatMessages]);

  return (
    <div className={cn("w-full flex flex-col p-2")}>
      <div className="flex h-full w-full p-2 gap-2">
        <AutosizeTextarea
          className="flex-1"
          value={input}
          onKeyDown={handleKeyDown}
          placeholder={"Ask me anything... (Shift + Enter to send)"}
          onChange={handleInputChange}
        />
        <Button
          disabled={isLoading}
          onClick={handleSend}
          size={"icon"}
          className="flex items-center justify-center"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
      <div className="mt-2 mb-4 grid grid-cols-4">
        <SearchableSelect
          value={model}
          options={availableModels.map((model) => ({
            value: model.id,
            label: model.name,
          }))}
          placeholder="Select a model"
        />
      </div>
    </div>
  );
}
