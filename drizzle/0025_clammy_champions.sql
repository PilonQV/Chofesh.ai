CREATE TABLE `scheduled_tasks` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`schedule_cron` text NOT NULL,
	`timezone` text NOT NULL DEFAULT ('UTC'),
	`task_type` text NOT NULL,
	`task_config` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`timeout_minutes` int NOT NULL DEFAULT 5,
	`notify_on_complete` boolean NOT NULL DEFAULT true,
	`notify_on_error` boolean NOT NULL DEFAULT true,
	`last_run_at` timestamp,
	`next_run_at` timestamp NOT NULL,
	`last_status` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scheduled_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `task_executions` (
	`id` varchar(36) NOT NULL,
	`task_id` varchar(36) NOT NULL,
	`status` text NOT NULL DEFAULT ('pending'),
	`result` json,
	`error_message` text,
	`error_stack` text,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`duration_ms` int,
	`triggered_by` text NOT NULL DEFAULT ('scheduler'),
	CONSTRAINT `task_executions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` varchar(36) NOT NULL,
	`webhook_id` varchar(36) NOT NULL,
	`event_type` text NOT NULL,
	`payload` json NOT NULL,
	`status` text NOT NULL DEFAULT ('pending'),
	`attempts` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 5,
	`response_status` int,
	`response_body` text,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`next_retry_at` timestamp,
	`delivered_at` timestamp,
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text NOT NULL,
	`events` json NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`retry_config` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`last_delivery_at` timestamp,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `scheduled_tasks` ADD CONSTRAINT `scheduled_tasks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_executions` ADD CONSTRAINT `task_executions_task_id_scheduled_tasks_id_fk` FOREIGN KEY (`task_id`) REFERENCES `scheduled_tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhook_deliveries` ADD CONSTRAINT `webhook_deliveries_webhook_id_webhooks_id_fk` FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhooks` ADD CONSTRAINT `webhooks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `scheduled_tasks_user_id_idx` ON `scheduled_tasks` (`user_id`);--> statement-breakpoint
CREATE INDEX `scheduled_tasks_active_idx` ON `scheduled_tasks` (`active`);--> statement-breakpoint
CREATE INDEX `scheduled_tasks_next_run_idx` ON `scheduled_tasks` (`next_run_at`);--> statement-breakpoint
CREATE INDEX `task_executions_task_id_idx` ON `task_executions` (`task_id`);--> statement-breakpoint
CREATE INDEX `task_executions_status_idx` ON `task_executions` (`status`);--> statement-breakpoint
CREATE INDEX `task_executions_started_at_idx` ON `task_executions` (`started_at`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_webhook_id_idx` ON `webhook_deliveries` (`webhook_id`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_status_idx` ON `webhook_deliveries` (`status`);--> statement-breakpoint
CREATE INDEX `webhook_deliveries_next_retry_idx` ON `webhook_deliveries` (`next_retry_at`);--> statement-breakpoint
CREATE INDEX `webhooks_user_id_idx` ON `webhooks` (`user_id`);--> statement-breakpoint
CREATE INDEX `webhooks_active_idx` ON `webhooks` (`active`);