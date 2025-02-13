import { create } from "zustand";
import type { MessageStatus } from "~/routes/api.chat";

type ChatStore = {
	messageStatus: MessageStatus | null;
	setMessageStatus: (status: MessageStatus | null) => void;
	refreshConversationsListKey: number;
	refreshConversationsList: () => void;
};
const useChatStore = create<ChatStore>((set) => ({
	messageStatus: null,
	setMessageStatus: (messageStatus) => set(() => ({ messageStatus })),
	refreshConversationsListKey: 0,
	refreshConversationsList: () =>
		set((state) => ({
			refreshConversationsListKey: state.refreshConversationsListKey + 1,
		})),
}));

export default useChatStore;
