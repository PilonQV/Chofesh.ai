CREATE TABLE `agent_episodic_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`episodeType` varchar(50) NOT NULL,
	`context` text NOT NULL,
	`action` text NOT NULL,
	`result` text NOT NULL,
	`outcome` enum('success','partial','failure') NOT NULL,
	`confidence` int NOT NULL DEFAULT 50,
	`toolsUsed` text,
	`duration` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_episodic_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_long_term_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredResponseStyle` varchar(50),
	`preferredLanguage` varchar(10),
	`recentInteractions` text,
	`toolUsageStats` text,
	`commonTopics` text,
	`learningPatterns` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_long_term_memory_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_long_term_memory_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `agent_short_term_memory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_short_term_memory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_tool_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`toolName` varchar(50) NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`successCount` int NOT NULL DEFAULT 0,
	`failureCount` int NOT NULL DEFAULT 0,
	`averageDuration` int NOT NULL DEFAULT 0,
	`lastUsed` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_tool_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_collaborators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`permission` enum('view','comment','edit') NOT NULL DEFAULT 'view',
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`invitedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	CONSTRAINT `conversation_collaborators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`messageIndex` int,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`shortDescription` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`itemType` enum('agent','workflow','template','integration') NOT NULL,
	`category` enum('productivity','development','marketing','sales','support','analytics','automation','content','research','other') NOT NULL DEFAULT 'other',
	`tags` text,
	`configuration` text NOT NULL,
	`requirements` text,
	`iconUrl` text,
	`screenshotUrls` text,
	`demoUrl` text,
	`priceType` enum('free','paid','freemium') NOT NULL DEFAULT 'free',
	`priceCredits` int DEFAULT 0,
	`status` enum('draft','pending_review','published','rejected','archived') NOT NULL DEFAULT 'draft',
	`isVerified` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`installCount` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`version` varchar(20) NOT NULL DEFAULT '1.0.0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `marketplace_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplace_items_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `marketplace_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplace_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`encryptedData` text NOT NULL,
	`shareType` enum('private','link','team') NOT NULL DEFAULT 'private',
	`accessToken` varchar(64),
	`allowComments` boolean NOT NULL DEFAULT true,
	`allowFork` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`viewCount` int NOT NULL DEFAULT 0,
	`forkCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_conversations_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `skill_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`skillId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`prompt` text NOT NULL,
	`systemPrompt` text,
	`parameters` text,
	`category` enum('coding','writing','analysis','research','creative','business','education','productivity','other') NOT NULL DEFAULT 'other',
	`tags` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isVerified` boolean NOT NULL DEFAULT false,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`usageCount` int NOT NULL DEFAULT 0,
	`forkCount` int NOT NULL DEFAULT 0,
	`rating` int NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`version` varchar(20) NOT NULL DEFAULT '1.0.0',
	`forkedFromId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`),
	CONSTRAINT `skills_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`installedVersion` varchar(20) NOT NULL,
	`configuration` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `user_installations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `agent_episodic_memory` ADD CONSTRAINT `agent_episodic_memory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_long_term_memory` ADD CONSTRAINT `agent_long_term_memory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_short_term_memory` ADD CONSTRAINT `agent_short_term_memory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `agent_tool_preferences` ADD CONSTRAINT `agent_tool_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_collaborators` ADD CONSTRAINT `conversation_collaborators_conversationId_shared_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `shared_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_collaborators` ADD CONSTRAINT `conversation_collaborators_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_collaborators` ADD CONSTRAINT `conversation_collaborators_invitedBy_users_id_fk` FOREIGN KEY (`invitedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_comments` ADD CONSTRAINT `conversation_comments_conversationId_shared_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `shared_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_comments` ADD CONSTRAINT `conversation_comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_items` ADD CONSTRAINT `marketplace_items_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_ratings` ADD CONSTRAINT `marketplace_ratings_itemId_marketplace_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `marketplace_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `marketplace_ratings` ADD CONSTRAINT `marketplace_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shared_conversations` ADD CONSTRAINT `shared_conversations_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_ratings` ADD CONSTRAINT `skill_ratings_skillId_skills_id_fk` FOREIGN KEY (`skillId`) REFERENCES `skills`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skill_ratings` ADD CONSTRAINT `skill_ratings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `skills` ADD CONSTRAINT `skills_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_installations` ADD CONSTRAINT `user_installations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_installations` ADD CONSTRAINT `user_installations_itemId_marketplace_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `marketplace_items`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_episodic_idx` ON `agent_episodic_memory` (`userId`);--> statement-breakpoint
CREATE INDEX `episode_type_idx` ON `agent_episodic_memory` (`episodeType`);--> statement-breakpoint
CREATE INDEX `episodic_timestamp_idx` ON `agent_episodic_memory` (`timestamp`);--> statement-breakpoint
CREATE INDEX `user_long_term_idx` ON `agent_long_term_memory` (`userId`);--> statement-breakpoint
CREATE INDEX `conversation_idx` ON `agent_short_term_memory` (`conversationId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `agent_short_term_memory` (`userId`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `agent_short_term_memory` (`timestamp`);--> statement-breakpoint
CREATE INDEX `user_tool_idx` ON `agent_tool_preferences` (`userId`,`toolName`);