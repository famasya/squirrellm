import type { Message } from "ai/react";
import { create } from "zustand";

type ChatStore = {
	messages: Message[];
	setMessages: (messages: Message[]) => void;
};
const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	setMessages: (messages) => set({ messages }),
}));

export default useChatStore;
