ALTER TABLE `messages` ADD `sent` integer DEFAULT true;--> statement-breakpoint
ALTER TABLE `messages` ADD `executionTime` integer DEFAULT 0 NOT NULL;