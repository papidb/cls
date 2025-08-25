import {
  metricsRequestSchema,
  type MetricsRequest,
} from "@/schema/payload.schema";
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

const bucketSeconds: Record<"minute" | "hour" | "day" | "week", number> = {
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
};

function bucketExpr(unit: keyof typeof bucketSeconds) {
  const step = bucketSeconds[unit];
  return `intDiv(toUnixTimestamp(timestamp), ${step}) * ${step}`;
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
        // @ts-ignore
        Crawlers.browser || [],
        // @ts-ignore
        CLIs.browser || [],
        // @ts-ignore
        Emails.browser || [],
        // @ts-ignore
        Fetchers.browser || [],
        // @ts-ignore
        InApps.browser || [],
        // @ts-ignore
        MediaPlayers.browser || [],
        // @ts-ignore
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

  async metrics(input: MetricsRequest) {
    const req = metricsRequestSchema.parse(input);

    let q = sql.select();

    // ---- time bucket (optional) ----
    if (req.bucket) {
      const expr = bucketExpr(req.bucket);
      q = q.select(`${expr} AS bucket`).groupBy("bucket").orderBy("bucket ASC");
    }

    // ---- dimensions ----
    for (const d of req.dimensions || []) {
      const phys = toPhysical(d.col);
      const alias = sanitizeIdent(d.alias || d.col);
      q = q.select(`${phys} AS ${alias}`).groupBy(phys);
    }

    // ---- metrics ----
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

    // ---- filters ----
    for (const f of req.filters || []) {
      if (f.op === "eq") {
        if (f.value !== null && f.value !== undefined) {
          q = q.where({ [toPhysical(f.col)]: f.value });
        }
      } else if (f.op === "in") {
        const list = f.values
          .filter((v) => v !== null && v !== undefined)
          .map((v) =>
            typeof v === "number" ? String(v) : sql.val(v).toString()
          )
          .join(",");
        q = q.where(`${toPhysical(f.col)} IN (${list})`);
      } else if (f.op === "sinceDays") {
        const days = Math.max(1, Math.min(3650, Number(f.days) || 1));
        q = q.where(`timestamp >= now() - INTERVAL '${days}' DAY`);
      } else if (f.op === "betweenTime") {
        if (f.startIso && f.endIso) {
          q = q.where(
            `timestamp >= ${sql.val(f.startIso)} AND timestamp < ${sql.val(
              f.endIso
            )}`
          );
        }
      }
    }

    q = q.from(`'link-clicks-production'`);

    for (const o of req.orderBy || []) {
      q = q.orderBy(`${sanitizeIdent(o.expr)} ${o.dir || "DESC"}`);
    }

    let sqlString = q.toString();
    if (typeof req.limit === "number") sqlString += ` LIMIT ${req.limit}`;

    sqlString = sqlString.replace(
      /(INTERVAL\s*'?\d+'?\s*DAY)\s+IS\s+NULL/gi,
      "$1"
    );

    return this.runAE(sqlString);
  }
}
