CREATE TABLE `admin_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`encrypted_username` text NOT NULL,
	`encrypted_password` text NOT NULL,
	`account_type` varchar(64) NOT NULL DEFAULT 'three_rivers_parks',
	`is_active` int NOT NULL DEFAULT 1,
	`last_scraped_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badge_ins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season_id` int NOT NULL,
	`badge_in_date` date NOT NULL,
	`badge_in_time` varchar(8),
	`pass_type` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `badge_ins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`season_id` int NOT NULL,
	`projection_date` date NOT NULL,
	`conservative_total` int,
	`average_total` int,
	`optimistic_total` int,
	`current_total` int,
	`visit_rate` decimal(5,2),
	`estimated_end_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scraping_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`credential_id` int NOT NULL,
	`status` enum('success','failed','partial') NOT NULL,
	`badge_ins_found` int DEFAULT 0,
	`badge_ins_added` int DEFAULT 0,
	`error_message` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scraping_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`start_date` date NOT NULL,
	`estimated_end_date` date,
	`actual_end_date` date,
	`status` enum('active','completed','upcoming') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weather_forecasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`forecast_date` date NOT NULL,
	`temperature` decimal(5,2),
	`condition` varchar(64),
	`snow_probability` decimal(5,2),
	`raw_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weather_forecasts_id` PRIMARY KEY(`id`)
);
