ALTER TABLE `users` ADD `nsfwSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `nsfwSubscriptionStatus` enum('active','canceled','past_due','none') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `nsfwImagesUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `nsfwImagesResetAt` timestamp;