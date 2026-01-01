CREATE TABLE `ai_characters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`systemPrompt` text NOT NULL,
	`avatarUrl` text,
	`personality` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_characters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`encryptedData` text NOT NULL,
	`title` varchar(255),
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`maxViews` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_links_shareId_unique` UNIQUE(`shareId`)
);
--> statement-breakpoint
ALTER TABLE `ai_characters` ADD CONSTRAINT `ai_characters_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shared_links` ADD CONSTRAINT `shared_links_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;