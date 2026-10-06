ALTER TABLE `players` ADD `room_id` text DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `preferred_dates` text DEFAULT '[]' NOT NULL;