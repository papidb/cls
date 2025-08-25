import { DatabaseConnection } from "@/app.bind";
import { getFromContainer } from "@/app.container";
import { links } from "@/db/schema";
import type { Link } from "@/schema/model.schema";
import type {
  CreateLinkPayload,
  QueryLinksPayload,
} from "@/schema/payload.schema";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, gt, ilike, lt } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DateTime } from "luxon";
import { CacheService } from "./cache.service";

export class LinkService {
  async getLinks(q: QueryLinksPayload) {
    const { cursor, text, order, size } = { ...q, size: 100 };

    const db = getFromContainer(DatabaseConnection);
    const query = await db
      .select()
      .from(links)
      .where(
        and(
          cursor
            ? order === "asc"
              ? gt(links.id, cursor)
              : lt(links.id, cursor)
            : undefined,
          text ? ilike(links.description, `%${text}%`) : undefined
        )
      )
      .limit(size)
      .orderBy(order === "asc" ? asc(links.id) : desc(links.id));
    return query;
  }

  async createLink(userId: string, data: CreateLinkPayload) {
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
        slug: data.slug,
        url: data.url,
        userId: userId,
        description: data.description,
        expiration: data.expiration
          ? DateTime.fromJSDate(data.expiration).toJSDate()
          : null,
        createdAt: DateTime.now().toJSDate(),
        updatedAt: DateTime.now().toJSDate(),
      })
      .returning();

    await cacheService.set(
      link.slug,
      JSON.stringify(link),
      data.expiration
        ? DateTime.fromJSDate(data.expiration).toSeconds()
        : undefined
    );

    return link;
  }

  async getLinkById(id: number) {
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

  async getLinkBySlug(slug: string) {
    const cacheLink = await env.LINK_STORE.get(slug);
    if (!cacheLink) {
      const db = getFromContainer(DatabaseConnection);

      const [link] = await db
        .select()
        .from(links)
        .where(eq(links.slug, slug))
        .limit(1);

      if (link) {
        return link;
      }
      throw new HTTPException(404, { message: "Link not found" });
    }
    return JSON.parse(cacheLink) as Link;
  }
}
