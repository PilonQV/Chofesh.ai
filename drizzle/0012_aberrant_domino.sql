CREATE TABLE `generated_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`prompt` text NOT NULL,
	`negativePrompt` text,
	`model` varchar(64) NOT NULL DEFAULT 'flux',
	`aspectRatio` varchar(20),
	`seed` varchar(64),
	`steps` int,
	`cfgScale` varchar(10),
	`isEdit` boolean NOT NULL DEFAULT false,
	`originalImageUrl` text,
	`status` enum('completed','failed') NOT NULL DEFAULT 'completed',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generated_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generated_images` ADD CONSTRAINT `generated_images_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;