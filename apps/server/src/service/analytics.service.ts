import { metricsRequestSchema } from "@/schema/payload.schema";
import { logger } from "@/utils/logger";
import {
  firstIp,
  getFlag,
  logs2blobs,
  logs2doubles,
  toPhysical,
  type LogsMap,
} from "@/utils/logs";
import { env } from "cloudflare:workers";
import type { Context } from "hono";
import type { BlankEnv } from "hono/types";
import { parseAcceptLanguage } from "intl-parse-accept-language";
import sql from "sql-bricks";
import { UAParser } from "ua-parser-js";
import {
  CLIs,
  Crawlers,
  Emails,
  ExtraDevices,
  Fetchers,
  InApps,
  MediaPlayers,
  Vehicles,
} from "ua-parser-js/extensions";

function sanitizeIdent(id: string) {
  // keep it simple: A-Z a-z 0-9 _
  return id.replace(/[^a-zA-Z0-9_]/g, "");
}

export class AnalyticsService {
  private async runAE(sql: string) {
    logger.info(sql);
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        },
        body: sql,
      }
    );
    const jsonResponse = await response.json();
    // @ts-ignore
    return jsonResponse.data;
  }

  async write(
    c: Context<BlankEnv>,
    link: { id: string; slug?: string; url?: string }
  ) {
    const req = c.req;
    const headers = req.header.bind(req);
    const cf = c.req.raw.cf;

    // IP
    const ip =
      headers("cf-connecting-ip") ||
      headers("x-real-ip") ||
      firstIp(headers("x-forwarded-for")) ||
      "";

    // Referer (host only)
    let referer = "";
    const ref = headers("referer") || "";
    try {
      referer = ref ? new URL(ref).host : "";
    } catch {
      referer = "";
    }

    // Language
    const acceptLanguage = headers("accept-language") || "";
    const language = (parseAcceptLanguage(acceptLanguage) || [])[0];

    logger.child({ language }).info("language");

    // UA parse with extensions
    const userAgent = headers("user-agent") || "";
    const parser = new UAParser(userAgent, {
      browser: [
        Crawlers.browser || [],
        CLIs.browser || [],
        Emails.browser || [],
        Fetchers.browser || [],
        InApps.browser || [],
        MediaPlayers.browser || [],
        Vehicles.browser || [],
      ].flat(),
      // @ts-expect-error upstream typing
      device: [ExtraDevices.device || []].flat(),
    });
    const uaInfo = parser.getResult();

    logger.child({ uaInfo }).info("uaInfo");

    // Geo and display
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    const countryCode = cf?.country as string | undefined;
    const countryName = regionNames.of(countryCode || "WD") || "Worldwide";
    const flag = getFlag(countryCode);

    const accessLogs: LogsMap = {
      url: link.url,
      slug: link.slug,
      ua: userAgent,
      ip,
      referer,
      country: countryCode,
      region: `${flag} ${[cf?.region, countryName].filter(Boolean).join(",")}`,
      city: `${flag} ${[cf?.city, countryName].filter(Boolean).join(",")}`,
      timezone: cf?.timezone as string | undefined,
      language,
      os: uaInfo?.os?.name,
      browser: uaInfo?.browser?.name,
      browserType: uaInfo?.browser?.type,
      device: uaInfo?.device?.model,
      deviceType: uaInfo?.device?.type,
      COLO: cf?.colo as string | undefined,
      latitude: Number(
        (cf?.latitude as unknown as string) || headers("cf-iplatitude") || 0
      ),
      longitude: Number(
        (cf?.longitude as unknown as string) || headers("cf-iplongitude") || 0
      ),
    };

    logger.child({ accessLogs, link }).info("Access logs");

    await env.ANALYTICS.writeDataPoint({
      indexes: [link.id], // single index
      blobs: logs2blobs(accessLogs),
      doubles: logs2doubles(accessLogs),
    });
  }

  async metrics(input: unknown) {
    // 1) Validate
    const req = metricsRequestSchema.parse(input);

    // 2) Compose SQL
    let q = sql.select();

    // bucket first so alias exists
    if (req.bucket) {
      q = q
        .select(`DATE_TRUNC('${req.bucket}', timestamp) AS bucket`)
        .groupBy("bucket");
    }

    // dimensions
    for (const d of req.dimensions || []) {
      const phys = toPhysical(d.col);
      const alias = sanitizeIdent(d.alias || d.col);
      q = q.select(`${phys} AS ${alias}`).groupBy(phys);
    }

    // metrics
    for (const m of req.metrics) {
      if (m.kind === "clicks") {
        const alias = sanitizeIdent(m.alias || "clicks");
        q = q.select(`SUM(_sample_interval) AS ${alias}`);
      } else if (m.kind === "uniques") {
        const phys = toPhysical(m.on);
        const alias = sanitizeIdent(m.alias || "uniques");
        q = q.select(`COUNT(DISTINCT ${phys}) AS ${alias}`);
      }
    }

    // filters
    for (const f of req.filters || []) {
      if (f.op === "eq") {
        q = q.where({ [toPhysical(f.col)]: f.value });
      } else if (f.op === "in") {
        const list = f.values.map((v) =>
          typeof v === "number" ? v : sql.val(v)
        );
        // sql-bricks does not build IN with an array directly for objects, so use raw
        q = q.where(`${toPhysical(f.col)} IN (${list.map(String).join(",")})`);
      } else if (f.op === "sinceDays") {
        q = q.where(`timestamp >= NOW() - INTERVAL '${f.days}' DAY`);
      } else if (f.op === "betweenTime") {
        q = q.where(
          sql.and(
            sql(`timestamp >= ${sql.val(f.startIso)}`),
            sql(`timestamp < ${sql.val(f.endIso)}`)
          )
        );
      }
    }

    q = q.from(env.ANALYTICS_DATASET);

    // order
    for (const o of req.orderBy || []) {
      q = q.orderBy(`${sanitizeIdent(o.expr)} ${o.dir || "DESC"}`);
    }

    if (req.limit) q = q.limit(req.limit);

    const sqlString = q.toString();
    return this.runAE(sqlString);
  }
}
