CREATE TABLE `project_files` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`url` varchar(512) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`size` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_images` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(36) NOT NULL,
	`url` varchar(512) NOT NULL,
	`prompt` text,
	`type` varchar(50),
	`order` int DEFAULT 0,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('kids_book','website','app','marketing','business_plan','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`inputs` json,
	`outputs` json,
	`thumbnail_url` varchar(512),
	`is_public` int NOT NULL DEFAULT 0,
	`share_token` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completed_at` timestamp,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
