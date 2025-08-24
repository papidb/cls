PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`user_id` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`expiration` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_links`("id", "url", "user_id", "description", "slug", "expiration", "created_at", "updated_at") SELECT "id", "url", "user_id", "description", "slug", "expiration", "created_at", "updated_at" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `links_slug_unique` ON `links` (`slug`);