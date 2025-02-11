ALTER TABLE `messages` RENAME COLUMN "sessionId" TO "conversationId";--> statement-breakpoint
ALTER TABLE `messages` ALTER COLUMN "conversationId" TO "conversationId" text NOT NULL REFERENCES conversations(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `models` ADD `profile` text NOT NULL;--> statement-breakpoint
ALTER TABLE `models` ADD `temperature` text(5) DEFAULT '1';--> statement-breakpoint
ALTER TABLE `models` ADD `metadata` text NOT NULL;