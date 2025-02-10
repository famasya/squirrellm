import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";

type Props = {
	children: JSX.Element | JSX.Element[];
};

type CodeBlockProps = {
	children: string;
	className: string;
};

export const CodeBlock = ({ children, className }: CodeBlockProps) => {
	const language = className?.replace("lang-", "");

	return <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>;
};

export const PreCodeBlock = ({ children, ...rest }: Props) => {
	if ("type" in children && children.type === "code") {
		return CodeBlock({
			children: children.props.childen,
			className: children.props.className,
		});
	}
	return <pre {...rest}>{children}</pre>;
};
