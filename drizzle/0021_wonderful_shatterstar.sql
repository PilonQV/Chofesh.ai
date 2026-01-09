CREATE TABLE `support_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`category` varchar(64) NOT NULL DEFAULT 'general',
	`priority` varchar(32) NOT NULL DEFAULT 'normal',
	`message` text NOT NULL,
	`userId` int,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`adminNotes` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `support_requests_id` PRIMARY KEY(`id`)
);
