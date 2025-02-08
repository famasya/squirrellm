CREATE TABLE `models` (
	`route` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`systemMessage` text NOT NULL,
	`isDefault` integer DEFAULT 0
);
