CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`createdAt` integer NOT NULL,
	`content` text NOT NULL,
	`model` text NOT NULL,
	`sessionId` text NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
