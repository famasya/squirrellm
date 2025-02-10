import { useNavigate } from "@remix-run/react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import { AlertDialogWrapper } from "~/components/ui/alert-dialog";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import useChatStore from "~/lib/stores";

type Props = {
	handleSend: () => void;
	input: string;
	isLoading: boolean;
	lastUsedModel: string;
	handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	availableModels: { id: string; name: string }[];
	sessionId: string;
};

export default function AppChatbox({
	availableModels,
	input,
	lastUsedModel,
	isLoading,
	handleInputChange,
	handleSend,
	sessionId,
}: Props) {
	const navigate = useNavigate();
	const { refreshConversationsList } = useChatStore();
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
				refreshConversationsList();
				navigate("/");
			},
			onError: (error) => {
				console.log(error);
				toast.error("Error deleting chat. Please try again");
			},
		},
	);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	};

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
								value={lastUsedModel}
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
