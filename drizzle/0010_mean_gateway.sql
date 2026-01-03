CREATE TABLE `rate_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`identifier_type` enum('ip','email') NOT NULL,
	`attempts` int NOT NULL DEFAULT 1,
	`first_attempt_at` timestamp NOT NULL DEFAULT (now()),
	`last_attempt_at` timestamp NOT NULL DEFAULT (now()),
	`blocked_until` timestamp,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`)
);
