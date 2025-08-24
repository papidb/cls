import { DatabaseConnection } from "@/app.bind";
import { getFromContainer } from "@/app.container";
import { links } from "@/db/schema";
import type { CreateLinkPayload } from "@/schema/payload.schema";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DateTime } from "luxon";
import { ulid } from "ulid";
import { CacheService } from "./cache.service";

export class LinkService {
  getLinks(_: unknown) {
    return [];
  }

  async createLink(data: CreateLinkPayload) {
    const slug = data.slug;
    const cacheService = getFromContainer(CacheService);

    const linkInCache = await cacheService.get(slug);
    if (linkInCache) {
      throw new HTTPException(409, { message: "Link already exists" });
    }
    const db = getFromContainer(DatabaseConnection);
    const [link] = await db
      .insert(links)
      .values({
        id: ulid(),
        slug: data.slug,
        url: data.url,
        description: data.description,
        expiration: data.expiration
          ? DateTime.fromJSDate(data.expiration).toJSDate()
          : null,
        createdAt: DateTime.now().toJSDate(),
        updatedAt: DateTime.now().toJSDate(),
      })
      .returning();

    return link;
  }

  async getLinkById(id: string) {
    const db = getFromContainer(DatabaseConnection);
    const [link] = await db
      .select()
      .from(links)
      .where(eq(links.id, id))
      .limit(1);
    if (!link) {
      throw new HTTPException(404, { message: "Link not found" });
    }
    return link;
  }

  getLinkBySlug(slug: string) {
    return env.LINK_STORE.get(slug);
  }
}
