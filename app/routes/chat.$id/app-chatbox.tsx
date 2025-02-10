import { useNavigate } from "@remix-run/react";
import { TwitterSnowflake } from "@sapphire/snowflake";
import { useChat } from "ai/react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { AlertDialogWrapper } from "~/components/ui/alert-dialog";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import useChatStore from "~/lib/stores";

type Props = {
	storedMessages: {
		id: string;
		content: string;
		role: string;
		createdAt: Date;
	}[];
	initialMessage?: string;
	model: string;
	availableModels: { id: string; name: string }[];
	sessionId: string;
};

export default function AppChatbox({
	storedMessages,
	model,
	initialMessage,
	availableModels,
	sessionId,
}: Props) {
	const navigate = useNavigate();
	const { refreshSessions } = useChatStore();
	const { trigger, isMutating } = useSWRMutation(
		"/api/delete-chat",
		async (key, { arg }: { arg: string }) => {
			const response = await fetch(key, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: arg }),
			});
			return response.json();
		},
		{
			onSuccess: () => {
				toast.success("Chat deleted");
				refreshSessions();
				navigate("/");
			},
			onError: (error) => {
				console.log(error);
				toast.error("Error deleting chat. Please try again");
			},
		},
	);

	const {
		messages,
		input,
		isLoading,
		append,
		handleInputChange,
		handleSubmit,
	} = useChat({
		api: `/api/chat?sessionId=${sessionId}&model=${model}`,
		sendExtraMessageFields: true,
		initialMessages: storedMessages.map((message) => ({
			content: message.content,
			role: message.role as "assistant" | "user",
			id: message.id,
			createdAt: message.createdAt,
		})),
	});
	const { setSessionMessages } = useChatStore();

	const handleSend = () => {
		setSessionMessages([
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
		if (messages.length > 0) {
			setSessionMessages(messages.map((message) => ({ ...message })));
		}
	}, [messages, setSessionMessages]);

	useEffect(() => {
		// set messages to store
		setSessionMessages(
			storedMessages.map((message) => ({
				content: message.content,
				id: message.id,
				role: message.role as "assistant" | "user",
				createdAt: new Date(message.createdAt),
			})),
		);
	}, [storedMessages, setSessionMessages]);

	useEffect(() => {
		if (model && initialMessage && sessionId) {
			append({
				content: initialMessage,
				role: "user",
				id: TwitterSnowflake.generate().toString(),
				createdAt: new Date(),
			});
		}
	}, [append, initialMessage, model, sessionId]);

	return (
		<div>
			<div className="flex h-full w-full p-2 gap-2 flex-shrink-0">
				<div className="flex flex-col w-full">
					<AutosizeTextarea
						className="flex-1"
						value={input}
						disabled={isMutating}
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
							<AlertDialogWrapper
								title={"Clear chat"}
								description={"Are you sure you want to delete the chat?"}
								confirmAction={() => {
									trigger(sessionId);
								}}
								cancelAction={() => {}}
							>
								<Button disabled={isMutating} variant={"ghost"} size={"icon"}>
									<Trash2 />
								</Button>
							</AlertDialogWrapper>

							<Button
								disabled={isLoading || isMutating}
								onClick={handleSend}
								className="flex items-center justify-center"
							>
								{isLoading ? <Loader2 className="animate-spin" /> : <Send />}{" "}
								Send (Enter)
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
