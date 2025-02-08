import type { Message } from "ai/react";
import { create } from "zustand";

type MessageData = Message & {
	synced: boolean;
};

type ChatStore = {
	messages: MessageData[];
	setMessages: (messages: MessageData[]) => void;
};
const useChatStore = create<ChatStore>((set) => ({
	messages: [],
	setMessages: (messages) => set({ messages }),
}));

export default useChatStore;
