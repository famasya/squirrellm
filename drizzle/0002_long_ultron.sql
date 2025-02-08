ALTER TABLE `messages` ADD `promptToken` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `completionToken` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `totalToken` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` ADD `reasoning` text;