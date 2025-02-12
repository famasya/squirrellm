ALTER TABLE `profiles` ALTER COLUMN "isDefault" TO "isDefault" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `temperature` text DEFAULT '1' NOT NULL;