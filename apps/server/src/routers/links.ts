import { getFromContainer } from "@/app.container";
import { createLinkPayloadSchema } from "@/schema/payload.schema";
import { LinkService } from "@/service/link.service";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";

export const linksRouter = router({
  getAll: publicProcedure.query(() => {
    const linkService = getFromContainer(LinkService);
    return linkService.getLinks({});
  }),
  create: protectedProcedure
    .input(createLinkPayloadSchema)
    .mutation(async ({ input }) => {
      const linkService = getFromContainer(LinkService);
      const data = await linkService.createLink(input);
      return { success: true, data };
    }),
});
