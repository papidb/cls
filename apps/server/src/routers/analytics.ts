import { getFromContainer } from "@/app.container";
import { metricsRequestSchema } from "@/schema/payload.schema";
import { AnalyticsService } from "@/service/analytics.service";
import { LinkService } from "@/service/link.service";
import z from "zod";
import { protectedProcedure, router } from "../lib/trpc";

export const analyticsRouter = router({
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const analyticsService = getFromContainer(AnalyticsService);
      const linkService = getFromContainer(LinkService);
      const link = await linkService.getLinkBySlug(input.slug);
      return {};
    }),
  metrics: protectedProcedure
    .input(metricsRequestSchema)
    .query(async ({ input }) => {
      const analyticsService = getFromContainer(AnalyticsService);
      return analyticsService.metrics(input);
    }),
});
