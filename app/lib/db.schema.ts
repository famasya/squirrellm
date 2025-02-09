import * as s from "drizzle-orm/sqlite-core";

export const sessions = s.sqliteTable("sessions", {
	id: s.text().primaryKey(),
	createdAt: s.text().notNull(),
	name: s.text().notNull(),
});

export const messages = s.sqliteTable("messages", {
	id: s.text().primaryKey(),
	role: s.text().notNull(),
	createdAt: s.int().notNull(),
	content: s.text().notNull(),
	model: s.text().notNull(),
	promptToken: s.int().default(0),
	completionToken: s.int().default(0),
	totalToken: s.int().default(0),
	reasoning: s.text(),
	sessionId: s
		.text()
		.notNull()
		.references(() => sessions.id, { onDelete: "cascade" }),
});

export const models = s.sqliteTable("models", {
	id: s.text().primaryKey(),
	name: s.text().notNull(),
	systemMessage: s.text(),
	isDefault: s.int().default(0),
});
