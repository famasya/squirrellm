import { useChat } from "ai/react";
import { Loader2, Send } from "lucide-react";
import { useEffect } from "react";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import useChatStore from "~/lib/stores";
import { cn } from "~/lib/utils";

export default function AppChatbox({ initialMessages }: { initialMessages: { id: string; content: string; role: string }[] }) {
  const { messages, input, isLoading, handleInputChange, handleSubmit, append } = useChat();
  const { setMessages } = useChatStore();

  const handleSend = () => {
    const messagesData = messages.map((message) => ({ ...message, synced: false }));
    setMessages([
      ...messagesData,
      { id: Date.now().toString(), content: input, role: "user", synced: false },
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
    setMessages(messages.map((message) => ({ ...message, synced: false })));
  }, [messages, setMessages]);

  // handle initial messages
  useEffect(() => {
    // only set input if there's only 1 message
    if (initialMessages.length === 1) {
      append({
        content: initialMessages[0].content,
        role: "user",
      });
    }
  }, [initialMessages, append]);

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
      <div className="px-2 grid grid-cols-4">
        <SearchableSelect options={[{ label: "gemini-2.0-flash-lite-preview-02-05:free", value: "gemini-2.0-flash-lite-preview-02-05:free" }]} placeholder="Switch Model (m)" />
      </div>
    </div>
  );
}
