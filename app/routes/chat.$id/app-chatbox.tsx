import type { InferSelectModel } from "drizzle-orm";
import { Send, StopCircle, UploadCloud } from "lucide-react";
import { useCallback, useMemo } from "react";
import { AutosizeTextarea } from "~/components/ui/autosize-textarea";
import { Button } from "~/components/ui/button";
import { SearchableSelect } from "~/components/ui/searchable-select";
import type { profiles } from "~/lib/db.schema";
import useChatStore from "~/lib/stores";

type Props = {
	availableProfiles: InferSelectModel<typeof profiles>[];
	input: string;
	selectedProfile: string;
	id: string;
	stop: () => void;
	handleSend: () => void;
	handleProfileChange: (
		profileId: string,
		modelId: string,
		temperature: string,
		instruction: string | null,
	) => void;
	handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
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

	const onProfileChange = useCallback(
		(option: { value: string; label: string }) => {
			const selectedProfile = availableProfiles.find(
				(m) => m.id === option.value,
			) as InferSelectModel<typeof profiles>;
			handleProfileChange(
				selectedProfile.id,
				selectedProfile.modelId,
				selectedProfile.temperature,
				selectedProfile.systemMessage,
			);
		},
		[availableProfiles, handleProfileChange],
	);

	const options = useMemo(
		() =>
			availableProfiles.map((profile) => ({
				value: profile.id,
				label: profile.name,
				description: profile.modelId.split("/")[1],
			})),
		[availableProfiles],
	);

	const handleButtonClick = useCallback(() => {
		if (messageStatus?.status === "thinking") {
			stop();
		} else {
			handleSend();
		}
	}, [messageStatus, stop, handleSend]);

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
							<Button size={"sm"}>
								<UploadCloud /> Upload
							</Button>
							<SearchableSelect
								className="w-full"
								value={selectedProfile}
								options={options}
								onChange={onProfileChange}
								placeholder="Select a profile"
							/>
						</div>

						{/* controls */}
						<div className="flex items-center gap-2">
							<Button
								disabled={input === "" && messageStatus === null}
								onClick={handleButtonClick}
								size={"sm"}
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
