import * as s from "drizzle-orm/sqlite-core";

export const conversations = s.sqliteTable("conversations", {
	id: s.text().primaryKey().notNull(),
	createdAt: s.text().notNull(),
	name: s.text().notNull(),
});

export const profiles = s.sqliteTable("profiles", {
	id: s.text().primaryKey().notNull(),
	modelId: s.text().notNull(),
	name: s.text().notNull(),
	systemMessage: s.text(),
	isDefault: s.integer().notNull().default(0),
	temperature: s.text().notNull().default("1"),
	metadata: s.text().notNull(),
});

export const messages = s.sqliteTable("messages", {
	id: s.text().primaryKey().notNull(),
	role: s.text().notNull(),
	createdAt: s.integer().notNull(),
	content: s.text().notNull(),
	sent: s.integer({ mode: "boolean" }).default(true),
	executionTime: s.integer().notNull().default(0),
	model: s.text().notNull(),
	promptToken: s.integer().default(0),
	completionToken: s.integer().default(0),
	totalToken: s.integer().default(0),
	reasoning: s.text(),
	profileId: s.text().references(() => profiles.id), // nullable, we dont want to delete messages when we delete a profile
	conversationId: s
		.text()
		.notNull()
		.references(() => conversations.id, { onDelete: "cascade" }),
});
