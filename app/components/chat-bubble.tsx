import Markdown from "markdown-to-jsx";
import { cn } from "~/lib/utils";

type Props = {
  text: string;
  isBot?: boolean;
};

export default function ChatBubble({ text, isBot }: Props) {
  return <>
    <div className={cn("p-2 px-4 rounded-md w-fit max-w-[80%] text-sm", !isBot && "bg-primary/10 ml-auto")}>
      <Markdown options={{ forceBlock: true }}>{text}</Markdown>
    </div>
  </>;
}
