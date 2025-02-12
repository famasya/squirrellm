CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`modelId` text NOT NULL,
	`name` text NOT NULL,
	`systemMessage` text,
	`isDefault` integer DEFAULT 0,
	`metadata` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `models`;--> statement-breakpoint
ALTER TABLE `messages` ADD `modelId` text REFERENCES profiles(id);