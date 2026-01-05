CREATE TABLE `conversation_folder_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`folderId` int NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_folder_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) DEFAULT '#6366f1',
	`icon` varchar(50) DEFAULT 'folder',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `conversation_folder_mappings` ADD CONSTRAINT `conversation_folder_mappings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_folder_mappings` ADD CONSTRAINT `conversation_folder_mappings_folderId_conversation_folders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `conversation_folders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_folders` ADD CONSTRAINT `conversation_folders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;