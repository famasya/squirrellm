import TeX from "@matejmazur/react-katex";
import { format } from "date-fns";
import { Loader2, Squirrel } from "lucide-react";
import Markdown, { RuleType } from "markdown-to-jsx";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

type Props = {
	text: string;
	isBot?: boolean;
	model?: string;
	isThinking?: boolean;
	createdAt: Date;
	id: string;
};

export default function ChatBubble({
	text,
	isBot,
	model,
	isThinking,
	createdAt,
	id,
}: Props) {
	const showThinking = isBot && isThinking;
	return (
		<div>
			{!isBot && (
				<div className="text-sm text-gray-500 text-right mr-3 mb-1">
					You at {format(createdAt, "HH:mm")}
				</div>
			)}
			<div
				className={cn(
					"p-2 px-4 rounded-full w-fit max-w-[80%] text-sm dark:text-gray-200",
					!isBot && "bg-primary/10 ml-auto",
					isBot && "flex flex-row gap-4",
				)}
			>
				{isBot && (
					<Avatar>
						<AvatarFallback className="bg-gradient-to-b from-gray-800 to-gray-800/80">
							<Squirrel />
						</AvatarFallback>
					</Avatar>
				)}
				<div>
					{isBot && (
						<div className="text-sm text-gray-500 flex flex-row items-center gap-2">
							<span>{model}</span>
							{showThinking ? (
								<span className="animate-pulse flex flex-row items-center gap-2">
									<Loader2 className="h-4 w-4 animate-spin" /> thinking...
								</span>
							) : (
								<span>at {format(createdAt, "HH:mm")}</span>
							)}
						</div>
					)}
					<Markdown
						className="markdown-content"
						options={{
							forceBlock: true,
							renderRule(next, node, renderChildren, state) {
								if (node.type === RuleType.codeBlock && node.lang === "latex") {
									return (
										<TeX
											as="div"
											key={state.key}
										>{String.raw`${node.text}`}</TeX>
									);
								}
								return next();
							},
						}}
					>
						{text}
					</Markdown>
				</div>
			</div>
		</div>
	);
}
