import { create } from "zustand";

type ChatStore = {
	isGeneratingResponse: boolean;
	setIsGeneratingResponse: (isGeneratingResponse: boolean) => void;
	refreshConversationsListKey: number;
	refreshConversationsList: () => void;
};
const useChatStore = create<ChatStore>((set) => ({
	isGeneratingResponse: false,
	setIsGeneratingResponse: (isGeneratingResponse) =>
		set(() => ({ isGeneratingResponse })),
	refreshConversationsListKey: 0,
	refreshConversationsList: () =>
		set((state) => ({
			refreshConversationsListKey: state.refreshConversationsListKey + 1,
		})),
}));

export default useChatStore;
