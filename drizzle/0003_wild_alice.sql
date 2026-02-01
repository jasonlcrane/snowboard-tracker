CREATE TABLE `weather_cache` (
	`date` date NOT NULL,
	`temp_high` decimal(5,2),
	`temp_low` decimal(5,2),
	`snowfall` decimal(5,2),
	`conditions` varchar(128),
	`source` varchar(32) DEFAULT 'open-meteo',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weather_cache_date` PRIMARY KEY(`date`)
);
