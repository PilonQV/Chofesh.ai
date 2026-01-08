CREATE TABLE `credit_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(64) NOT NULL,
	`modelTier` varchar(64),
	`model` varchar(64),
	`credits` int NOT NULL,
	`description` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`credits` int NOT NULL,
	`priceUsd` int NOT NULL,
	`stripePriceId` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_packs_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_packs_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus','daily_refresh') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`creditSource` enum('free','purchased'),
	`description` varchar(255),
	`actionType` varchar(64),
	`model` varchar(64),
	`stripePaymentId` varchar(64),
	`packName` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`freeCredits` int NOT NULL DEFAULT 30,
	`freeCreditsLastRefresh` timestamp NOT NULL DEFAULT (now()),
	`purchasedCredits` int NOT NULL DEFAULT 0,
	`totalCreditsUsed` int NOT NULL DEFAULT 0,
	`totalCreditsPurchased` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_credits_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_credits` ADD CONSTRAINT `user_credits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;