import TeX from "@matejmazur/react-katex";
import Markdown, { RuleType } from "markdown-to-jsx";
import { cn } from "~/lib/utils";
import { PreCodeBlock } from "./pre-block";

type Props = {
	text: string;
	isBot?: boolean;
};

export default function ChatBubble({ text, isBot }: Props) {
	return (
		<>
			<div
				className={cn(
					"p-2 px-4 rounded-full w-fit max-w-[80%] text-sm dark:text-gray-200",
					!isBot && "bg-primary/10 ml-auto",
				)}
			>
				<Markdown
					options={{
						forceBlock: true,
						renderRule(next, node, renderChildren, state) {
							if (node.type === RuleType.codeBlock && node.lang === "latex") {
								return (
									<TeX as="div" key={state.key}>{String.raw`${node.text}`}</TeX>
								);
							}
							return next();
						},
						overrides: {
							pre: PreCodeBlock,
						},
					}}
				>
					{text}
				</Markdown>
			</div>
		</>
	);
}
