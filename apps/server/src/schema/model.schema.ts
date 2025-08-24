import { links } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type z from "zod";

const linkSelectSchema = createSelectSchema(links);
export type Link = z.infer<typeof linkSelectSchema>;
