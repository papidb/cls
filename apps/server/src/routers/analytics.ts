import { getFromContainer } from "@/app.container";
import { AnalyticsService } from "@/service/analytics.service";
import { LinkService } from "@/service/link.service";
import z from "zod";
import { protectedProcedure, router } from "../lib/trpc";

export const analyticsRouter = router({
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const analyticsService = getFromContainer(AnalyticsService);
      const linkService = getFromContainer(LinkService);

      const link = await linkService.getLinkById(Number(input.id));
      return analyticsService.getLinkAnalytics(link.slug);
      return {};
    }),
});
