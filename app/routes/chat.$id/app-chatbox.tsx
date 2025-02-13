import type { InferSelectModel } from "drizzle-orm";
import { Send, StopCircle } from "lucide-react";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import type { profiles } from "~/lib/db.schema";
import useChatStore from "~/lib/stores";

type Props = {
	handleSend: () => void;
	input: string;
	selectedProfile: string;
	stop: () => void;
	id: string;
	handleProfileChange: (
		profileId: string,
		modelId: string,
		temperature: string,
		instruction: string | null,
	) => void;
	handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
	availableProfiles: InferSelectModel<typeof profiles>[];
};

export default function AppChatbox({
	availableProfiles,
	input,
	selectedProfile,
	id,
	stop,
	handleInputChange,
	handleSend,
	handleProfileChange,
}: Props) {
	const { messageStatus } = useChatStore();
	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	};

	const onProfileChange = (option: { value: string; label: string }) => {
		const selectedProfile = availableProfiles.find(
			(m) => m.id === option.value,
		) as InferSelectModel<typeof profiles>;
		handleProfileChange(
			selectedProfile.id,
			selectedProfile.modelId,
			selectedProfile.temperature,
			selectedProfile.systemMessage,
		);
	};

	return (
		<div key={id} className="relative">
			<div className="flex h-full w-full p-2 gap-2 flex-shrink-0">
				{/* message box */}
				<div className="flex flex-col w-full">
					<AutosizeTextarea
						className="flex-1"
						value={input}
						onKeyDown={handleKeyDown}
						placeholder={"Ask me anything... (Shift + Enter for new line)"}
						onChange={handleInputChange}
					/>

					{/* profile select */}
					<div className="mt-3 flex items-center justify-between">
						<div className="flex items-center gap-2 w-1/3">
							<SearchableSelect
								className="w-full"
								value={selectedProfile}
								options={availableProfiles.map((profile) => ({
									value: profile.id,
									label: profile.name,
									description: profile.modelId.split("/")[1],
								}))}
								onChange={onProfileChange}
								placeholder="Select a profile"
							/>
						</div>

						{/* controls */}
						<div className="flex items-center gap-2">
							<Button
								disabled={input === "" && messageStatus === null}
								onClick={
									messageStatus?.status === "thinking" ? stop : handleSend
								}
								className="flex items-center justify-center"
							>
								{messageStatus?.status === "thinking" ? (
									<span className="flex items-center gap-2">
										<StopCircle /> Stop
									</span>
								) : (
									<span className="flex items-center gap-2">
										<Send /> Send
									</span>
								)}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
