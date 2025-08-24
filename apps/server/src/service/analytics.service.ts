import { logger } from "@/utils/logger";
import { env } from "cloudflare:workers";
import { HTTPException } from "hono/http-exception";

export class AnalyticsService {
  private async query(sql: string) {
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

  async getLinkAnalytics(slug: string) {
    const sql = `SELECT blob4 as 'country', COUNT() as 'total' FROM '${env.ANALYTICS_DATASET}' WHERE blob1='${slug}' GROUP BY country`;
    logger.child({ sql }).info("Executing SQL query");
    return this.query(sql).catch((err) => {
      logger.child({ sql, err }).error("Error fetching link analytics");
      throw new HTTPException(500, { message: "Failed to fetch analytics" });
    });
  }
}
