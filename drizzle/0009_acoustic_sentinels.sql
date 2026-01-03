ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `verificationTokenExpiry` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;