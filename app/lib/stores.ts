import type { Message } from "ai/react";
import { create } from "zustand";

type ChatStore = {
	messages: Message[];
	setMessages: (messages: Message[]) => void;
	refreshSessionsKey: number;
	refreshSessions: () => void;
};
const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	setMessages: (messages) => set({ messages }),
	refreshSessionsKey: 0,
	refreshSessions: () =>
		set((state) => ({ refreshSessionsKey: state.refreshSessionsKey + 1 })),
}));

export default useChatStore;
