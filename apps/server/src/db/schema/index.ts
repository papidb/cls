import { int, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export * from "./auth";

export const links = sqliteTable("links", {
  id: int("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  userId: text("user_id").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  expiration: integer("expiration", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
