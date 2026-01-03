CREATE TABLE `artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('document','code','table','diagram','markdown') NOT NULL DEFAULT 'document',
	`content` text NOT NULL,
	`language` varchar(50),
	`version` int NOT NULL DEFAULT 1,
	`parentId` int,
	`conversationId` varchar(64),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`category` enum('preference','fact','context','instruction') NOT NULL DEFAULT 'fact',
	`importance` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`source` enum('user','auto') NOT NULL DEFAULT 'user',
	`isActive` boolean NOT NULL DEFAULT true,
	`lastUsed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`showThinking` boolean NOT NULL DEFAULT false,
	`thinkingExpanded` boolean NOT NULL DEFAULT false,
	`memoryEnabled` boolean NOT NULL DEFAULT true,
	`autoExtractMemories` boolean NOT NULL DEFAULT false,
	`artifactPanelEnabled` boolean NOT NULL DEFAULT true,
	`artifactPanelPosition` enum('right','bottom') NOT NULL DEFAULT 'right',
	`preferredResponseFormat` enum('detailed','concise','bullet','auto') NOT NULL DEFAULT 'auto',
	`codeTheme` varchar(50) DEFAULT 'github-dark',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `artifacts` ADD CONSTRAINT `artifacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_memories` ADD CONSTRAINT `user_memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;