CREATE TABLE `user_devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deviceFingerprint` varchar(64) NOT NULL,
	`deviceName` varchar(255),
	`lastIpAddress` varchar(45),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_devices` ADD CONSTRAINT `user_devices_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;