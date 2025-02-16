import TeX from "@matejmazur/react-katex";
import type { UseChatHelpers } from "ai/react";
import { format, formatDuration } from "date-fns";
import { RefreshCcw, Squirrel } from "lucide-react";
import Markdown, { RuleType } from "markdown-to-jsx";
import { useMemo } from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import useChatStore from "~/lib/stores";
import { cn } from "~/lib/utils";

type Props = {
	isBot?: boolean;
	model?: string;
	ref?: React.RefObject<HTMLDivElement>;
	message: UseChatHelpers["messages"][0];
	isLastMessage: boolean;
	regenerate: () => void;
};

export default function ChatBubble({
	isBot,
	model,
	ref,
	message,
	isLastMessage,
	regenerate,
}: Props) {
	const { messageStatus } = useChatStore();
	const isThinking = isLastMessage && messageStatus?.status === "thinking";
	const isFailed =
		messageStatus?.messageId === message.id &&
		messageStatus.status === "failed";
	const containsReasoning = message.parts.find(
		(part) => part.type === "reasoning",
	);
	const showReasoning =
		containsReasoning && containsReasoning.reasoning.length > 5 && isBot;
	const annotations = message.annotations?.[0];
	const executionTime = useMemo(() => {
		if (annotations) {
			const { executionTime } = annotations as { executionTime: number };
			return executionTime;
		}
		return 0;
	}, [annotations]);

	return (
		<div className={cn("my-2", !isBot && "ml-auto text-right")}>
			{!isBot && (
				<div className="text-sm text-gray-500 text-right mr-3 mb-1">
					You at {format(message.createdAt || Date.now(), "HH:mm")}
				</div>
			)}
			<div
				className={cn(
					"p-2 px-4 rounded-full text-sm dark:text-gray-200",
					!isBot && "bg-primary/10 ml-auto w-fit max-w-[200px] md:max-w-[50%]",
					isBot && "flex flex-row gap-4 max-w-[70%]",
				)}
			>
				{isBot && (
					<Avatar>
						<AvatarFallback className="bg-gradient-to-b from-gray-800 to-gray-800/80">
							<Squirrel />
						</AvatarFallback>
					</Avatar>
				)}
				<div className="overflow-x-hidden">
					{isBot && (
						<div className="text-sm text-gray-500 flex flex-row items-center gap-2 mb-2">
							<a
								href={`https://openrouter.ai/${model}`}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline max-w-[200px] md:max-w-none truncate"
							>
								{model}
							</a>
							{isThinking && !isFailed ? (
								<span className="animate-pulse flex flex-row items-center gap-2">
									is thinking...
								</span>
							) : (
								<span>
									at {format(message.createdAt || Date.now(), "HH:mm")}.
									Thinking for{" "}
									{formatDuration({ seconds: executionTime / 1000 })}
								</span>
							)}
						</div>
					)}

					<Accordion
						type="single"
						collapsible
						className={cn(
							"bg-dark/10 dark:bg-white/10 rounded-lg my-2",
							!showReasoning && "hidden",
						)}
						defaultValue={message.id}
					>
						<AccordionItem value={message.id}>
							<AccordionTrigger className="m-0 py-2 px-6 hover:no-underline">
								Reasoning
							</AccordionTrigger>
							<AccordionContent className="p-0">
								{message.parts.map((part, index) => {
									if (part.type === "reasoning") {
										return (
											<div key={index.toString()} className="reasoning">
												{part.reasoning.split(". ").map((reason, index) => {
													return (
														<span key={index.toString()}>
															{reason}. <br />
														</span>
													);
												})}
											</div>
										);
									}
								})}
							</AccordionContent>
						</AccordionItem>
					</Accordion>

					<div ref={ref}>
						<Markdown
							className="markdown-content"
							options={{
								forceBlock: true,
								renderRule(next, node, renderChildren, state) {
									if (
										node.type === RuleType.codeBlock &&
										node.lang === "latex"
									) {
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
							{isFailed
								? "Something went wrong. Please try again"
								: message.content}
						</Markdown>
					</div>
				</div>
			</div>
			<div
				className={cn(
					"text-sm mt-1",
					isBot && "ml-16 pl-1",
					(!isLastMessage || isThinking || isFailed) && "hidden",
				)}
			>
				<Button
					variant={"outline"}
					size={"sm"}
					onClick={regenerate}
					disabled={isThinking}
				>
					<RefreshCcw /> {isThinking ? "Regenerating..." : "Regenerate"}
				</Button>
			</div>
		</div>
	);
}
