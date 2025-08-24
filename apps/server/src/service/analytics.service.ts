import { env } from "cloudflare:workers";

export class AnalyticsService {
  private async query(sql: string) {
    console.log({ sql, omo: env.CLOUDFLARE_API_TOKEN });
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
    const sql = `SELECT blob4 as 'country', COUNT() as 'total' FROM analytics-dataset WHERE blob1='${slug}' GROUP BY country`;
    return this.query(sql);
  }
}
