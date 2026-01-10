CREATE TABLE `provider_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`provider` varchar(32) NOT NULL,
	`model` varchar(128) NOT NULL,
	`modelTier` enum('free','standard','premium') NOT NULL DEFAULT 'free',
	`actionType` enum('chat','image','search','code','document') NOT NULL DEFAULT 'chat',
	`inputTokens` int DEFAULT 0,
	`outputTokens` int DEFAULT 0,
	`totalTokens` int DEFAULT 0,
	`latencyMs` int,
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`costSaved` varchar(20),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provider_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_usage_daily` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` timestamp NOT NULL,
	`provider` varchar(32) NOT NULL,
	`model` varchar(128) NOT NULL,
	`totalRequests` int NOT NULL DEFAULT 0,
	`successfulRequests` int NOT NULL DEFAULT 0,
	`failedRequests` int NOT NULL DEFAULT 0,
	`totalTokens` bigint NOT NULL DEFAULT 0,
	`avgLatencyMs` int,
	`totalCostSaved` varchar(20),
	`uniqueUsers` int NOT NULL DEFAULT 0,
	CONSTRAINT `provider_usage_daily_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `provider_usage` ADD CONSTRAINT `provider_usage_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;