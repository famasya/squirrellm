PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`createdAt` integer NOT NULL,
	`content` text NOT NULL,
	`model` text NOT NULL,
	`promptToken` integer DEFAULT 0,
	`completionToken` integer DEFAULT 0,
	`totalToken` integer DEFAULT 0,
	`reasoning` text,
	`sessionId` text NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "role", "createdAt", "content", "model", "promptToken", "completionToken", "totalToken", "reasoning", "sessionId") SELECT "id", "role", "createdAt", "content", "model", "promptToken", "completionToken", "totalToken", "reasoning", "sessionId" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;