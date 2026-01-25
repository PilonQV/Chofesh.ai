ALTER TABLE `api_call_logs` ADD `isFlagged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `api_call_logs` ADD `flagReason` enum('nsfw_content','violence','hate_speech','illegal_activity','self_harm','spam','harassment','other');--> statement-breakpoint
ALTER TABLE `api_call_logs` ADD `flagDetails` text;--> statement-breakpoint
ALTER TABLE `image_access_logs` ADD `isFlagged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `image_access_logs` ADD `flagReason` enum('nsfw_content','violence','hate_speech','illegal_activity','self_harm','spam','harassment','other');--> statement-breakpoint
ALTER TABLE `image_access_logs` ADD `flagDetails` text;