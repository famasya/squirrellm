import type { InferSelectModel } from "drizzle-orm";
import { ChevronDown, Send, StopCircle } from "lucide-react";
import { ClientOnly } from "remix-utils/client-only";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import type { profiles } from "~/lib/db.schema";

type Props = {
	handleSend: () => void;
	input: string;
	isLoading: boolean;
	selectedProfile: string;
	stop: () => void;
	id: string;
	scrollToBottom: () => void;
	handleProfileChange: (profile: string, instruction?: string) => void;
	handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	availableProfiles: InferSelectModel<typeof profiles>[];
};

export default function AppChatbox({
	availableProfiles,
	input,
	selectedProfile,
	isLoading,
	id,
	scrollToBottom,
	stop,
	handleInputChange,
	handleSend,
	handleProfileChange,
}: Props) {
	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	};

	const onModelChange = (option: { value: string; label: string }) => {
		const selectedModel = availableProfiles.find((m) => m.id === option.value);
		if (selectedModel) {
			handleProfileChange(
				selectedModel.id,
				selectedModel.systemMessage || undefined,
			);
		}
	};

	return (
		<div key={id} className="relative">
			<div className="absolute right-0 top-[-2rem] right-6">
				<Button
					size="sm"
					onClick={scrollToBottom}
					className="dark:bg-white/20 dark:hover:bg-white/30 dark:text-white"
				>
					<ChevronDown /> Latest Message
				</Button>
			</div>
			<div className="flex h-full w-full p-2 gap-2 flex-shrink-0">
				<div className="flex flex-col w-full">
					<AutosizeTextarea
						className="flex-1"
						value={input}
						onKeyDown={handleKeyDown}
						placeholder={"Ask me anything... (Shift + Enter for new line)"}
						onChange={handleInputChange}
					/>
					<div className="mt-3 flex items-center justify-between">
						<div className="flex items-center gap-2 w-1/3">
							<SearchableSelect
								className="w-full"
								value={selectedProfile}
								options={availableProfiles.map((model) => ({
									value: model.id,
									label: model.name,
								}))}
								onChange={onModelChange}
								placeholder="Select a model"
							/>
						</div>
						<div className="flex items-center gap-2">
							<ClientOnly
								fallback={
									<Button disabled>
										{" "}
										<Send /> Send{" "}
									</Button>
								}
							>
								{() => (
									<Button
										disabled={input === "" && !isLoading}
										onClick={isLoading ? stop : handleSend}
										className="flex items-center justify-center"
									>
										{isLoading ? (
											<span className="flex items-center gap-2">
												<StopCircle /> Stop
											</span>
										) : (
											<span className="flex items-center gap-2">
												<Send /> Send
											</span>
										)}
									</Button>
								)}
							</ClientOnly>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
