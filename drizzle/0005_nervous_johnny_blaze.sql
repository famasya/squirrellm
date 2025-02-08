PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_models` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`systemMessage` text,
	`isDefault` integer DEFAULT 0
);
--> statement-breakpoint
INSERT INTO `__new_models`("id", "name", "systemMessage", "isDefault") SELECT "id", "name", "systemMessage", "isDefault" FROM `models`;--> statement-breakpoint
DROP TABLE `models`;--> statement-breakpoint
ALTER TABLE `__new_models` RENAME TO `models`;--> statement-breakpoint
PRAGMA foreign_keys=ON;