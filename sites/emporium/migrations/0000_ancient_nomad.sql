CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`ware` text NOT NULL,
	`symbol` text(4)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_ware_unique` ON `categories` (`name`,`ware`);--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`url` text(256) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `images_url_unique` ON `images` (`url`);--> statement-breakpoint
CREATE TABLE `jurisdictions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`abbreviation` text(2) NOT NULL,
	`name` text(256) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jurisdictions_abbreviation_unique` ON `jurisdictions` (`abbreviation`);--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ware` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plates` (
	`model_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jurisdiction_id` integer NOT NULL,
	`start_year` integer,
	`end_year` integer,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`jurisdiction_id`) REFERENCES `jurisdictions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`description` text(2048) NOT NULL,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_user_id_model_id_unique` ON `reviews` (`model_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `scores` (
	`model_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`value` integer NOT NULL,
	PRIMARY KEY(`model_id`, `user_id`, `category_id`),
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "value_within_0_10" CHECK("scores"."value" >= 0 AND "scores"."value" <= 10)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(256) NOT NULL,
	`serial` text(256) NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_serial_unique` ON `users` (`serial`);