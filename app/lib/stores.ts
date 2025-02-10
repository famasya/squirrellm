import type { Message } from "ai/react";
import { create } from "zustand";

type ChatStore = {
	conversationMessages: Message[];
	setConversationMessages: (messages: Message[]) => void;
	refreshConversationsListKey: number;
	refreshConversationsList: () => void;
};
const useChatStore = create<ChatStore>((set) => ({
	conversationMessages: [],
	setConversationMessages: (messages) =>
		set({ conversationMessages: messages }),
	refreshConversationsListKey: 0,
	refreshConversationsList: () =>
		set((state) => ({
			refreshConversationsListKey: state.refreshConversationsListKey + 1,
		})),
}));

export default useChatStore;
