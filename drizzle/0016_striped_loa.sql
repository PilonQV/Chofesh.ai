CREATE TABLE `api_call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userEmail` varchar(320),
	`userName` varchar(255),
	`actionType` enum('chat','image_generation','image_edit','document_chat','code_review','web_search','voice_transcription','embedding') NOT NULL,
	`modelUsed` varchar(64),
	`prompt` text,
	`systemPrompt` text,
	`response` text,
	`tokensInput` int,
	`tokensOutput` int,
	`durationMs` int,
	`conversationId` varchar(64),
	`personaUsed` varchar(64),
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','error','rate_limited') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(64) NOT NULL,
	`settingValue` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `audit_settings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
CREATE TABLE `image_access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userEmail` varchar(320),
	`imageUrl` text NOT NULL,
	`imageKey` varchar(255),
	`prompt` text,
	`actionType` enum('generate','view','download','delete') NOT NULL,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `image_access_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `api_call_logs` ADD CONSTRAINT `api_call_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_access_logs` ADD CONSTRAINT `image_access_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;