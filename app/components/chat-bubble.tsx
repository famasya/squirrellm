import Markdown from "markdown-to-jsx";
import { cn } from "~/lib/utils";

type Props = {
  text: string;
  isBot?: boolean;
};

export default function ChatBubble({ text, isBot }: Props) {
  return <>
    <div className={cn("p-2 px-4 rounded-full w-fit max-w-[80%] text-sm dark:text-gray-200", !isBot && "bg-primary/10 ml-auto")}>
      <Markdown options={{ forceBlock: true }}>{text}</Markdown>
    </div>
  </>;
}
