import { TwitterSnowflake } from "@sapphire/snowflake";
import { useChat } from "ai/react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import useChatStore from "~/lib/stores";

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
        id: TwitterSnowflake.generate().toString(),
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
    const uniqueMessages = new Set(messages.map((message) => message.id));
    setMessages(messages.map((message) => ({ ...message })));
  }, [messages, setMessages]);


  // handle initial messages
  useEffect(() => {
    if (initialMessages.length === 1) {
      // auto send the first message
      append({
        id: initialMessages[0].id,
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
    <div>
      <div className="flex h-full w-full p-2 gap-2 flex-shrink-0">
        <div className="flex flex-col w-full">
          <AutosizeTextarea
            className="flex-1"
            value={input}
            onKeyDown={handleKeyDown}
            placeholder={"Ask me anything... (Shift + Enter for new line)"}
            onChange={handleInputChange}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SearchableSelect
                value={model}
                options={availableModels.map((model) => ({
                  value: model.id,
                  label: model.name,
                }))}
                placeholder="Select a model"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={"ghost"} size={"icon"} ><Trash2 /></Button>
              <Button
                disabled={isLoading}
                onClick={handleSend}
                className="flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Send />} Send (Enter)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
