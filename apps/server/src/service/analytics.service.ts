import { AEQuery } from "@/impl/ae-query";
import { logger } from "@/utils/logger";
import {
  firstIp,
  getFlag,
  logs2blobs,
  logs2doubles,
  type LogsMap,
} from "@/utils/logs";
import { env } from "cloudflare:workers";
import type { Context } from "hono";
import type { BlankEnv } from "hono/types";
import { parseAcceptLanguage } from "intl-parse-accept-language";
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

export class AnalyticsService {
  private async runAE(sql: string) {
    logger.info(sql)
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

  async getTopCountries(slug: string) {
    const sql = new AEQuery()
      .selectDim("country", "country")
      .sumSample("clicks")
      .whereEq("slug", slug)
      .groupBy("country")
      .orderBy("clicks", "DESC")
      .limit(50)
      .build();
    return this.runAE(sql) as Promise<
      Array<{ country: string | null; clicks: number }>
    >;
  }

  async getTopLanguages(slug: string) {
    const sql = new AEQuery()
      .selectDim("language", "lang")
      .sumSample("clicks")
      .whereEq("slug", slug)
      .groupBy("language")
      .orderBy("clicks", "DESC")
      .limit(50)
      .build();
    return this.runAE(sql);
  }

  async getReferrers(slug: string) {
    const sql = new AEQuery()
      .selectDim("referer", "referrer_host")
      .sumSample("clicks")
      .whereEq("slug", slug)
      .groupBy("referer")
      .orderBy("clicks", "DESC")
      .limit(50)
      .build();
    return this.runAE(sql);
  }

  async getHourlySeries(slug: string) {
    const sql = new AEQuery()
      .timeBucket("hour", "bucket")
      .sumSample("clicks")
      .whereEq("slug", slug)
      .whereTimeSince(7)
      .orderBy("bucket", "ASC")
      .build();
    return this.runAE(sql);
  }
}
