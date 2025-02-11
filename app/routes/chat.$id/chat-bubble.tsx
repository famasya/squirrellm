import TeX from "@matejmazur/react-katex";
import type { UseChatHelpers } from "ai/react";
import { format } from "date-fns";
import { Squirrel } from "lucide-react";
import Markdown, { RuleType } from "markdown-to-jsx";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/components/ui/accordion";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

type Props = {
	isBot?: boolean;
	model?: string;
	ref?: React.RefObject<HTMLDivElement>;
	isThinking?: boolean;
	message: UseChatHelpers["messages"][0];
};

export default function ChatBubble({
	isBot,
	model,
	ref,
	isThinking,
	message,
}: Props) {
	const showThinking = isBot && isThinking;
	const containsReasoning =
		message.parts.find((part) => part.type === "reasoning") !== undefined;
	return (
		<div>
			{!isBot && (
				<div className="text-sm text-gray-500 text-right mr-3 mb-1">
					You at {format(message.createdAt || Date.now(), "HH:mm")}
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
						<div className="text-sm text-gray-500 flex flex-row items-center gap-2 mb-2">
							<a
								href={`https://openrouter.ai/${model}`}
								target="_blank"
								rel="noopener noreferrer"
								className="underline"
							>
								{model}
							</a>
							{showThinking ? (
								<span className="animate-pulse flex flex-row items-center gap-2">
									is thinking...
								</span>
							) : (
								<span>
									at {format(message.createdAt || Date.now(), "HH:mm")}
								</span>
							)}
						</div>
					)}

					<Accordion
						type="single"
						collapsible
						className={cn(
							"bg-dark/10 dark:bg-white/10 rounded-lg my-2",
							!containsReasoning && "hidden",
						)}
						defaultValue={message.id}
					>
						<AccordionItem value={message.id}>
							<AccordionTrigger className="m-0 py-2 px-6">
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
							{message.content}
						</Markdown>
					</div>
				</div>
			</div>
		</div>
	);
}
