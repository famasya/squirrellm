import * as s from "drizzle-orm/sqlite-core";

export const conversations = s.sqliteTable("conversations", {
	id: s.text().primaryKey().notNull(),
	createdAt: s.text().notNull(),
	name: s.text().notNull(),
});

export const models = s.sqliteTable("models", {
	id: s.text().primaryKey().notNull(),
	modelId: s.text().notNull(),
	name: s.text().notNull(),
	systemMessage: s.text(),
	isDefault: s.integer().default(0),
	metadata: s.text().notNull(),
});

export const messages = s.sqliteTable("messages", {
	id: s.text().primaryKey().notNull(),
	role: s.text().notNull(),
	createdAt: s.integer().notNull(),
	content: s.text().notNull(),
	model: s.text().notNull(),
	promptToken: s.integer().default(0),
	completionToken: s.integer().default(0),
	totalToken: s.integer().default(0),
	reasoning: s.text(),
	conversationId: s.text().notNull().references(() => conversations.id, { onDelete: "cascade" }),
});
