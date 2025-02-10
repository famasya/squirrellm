import type { Message } from "ai/react";
import { create } from "zustand";

type ChatStore = {
	messages: Message[];
	setSessionMessages: (messages: Message[]) => void;
	refreshSessionsKey: number;
	refreshSessions: () => void;
};
const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	setSessionMessages: (messages) => set({ messages }),
	refreshSessionsKey: 0,
	refreshSessions: () =>
		set((state) => ({ refreshSessionsKey: state.refreshSessionsKey + 1 })),
}));

export default useChatStore;
