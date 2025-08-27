import { getFromContainer } from "@/app.container";
import {
  createLinkPayloadSchema,
  queryLinksPayloadSchema,
} from "@/schema/payload.schema";
import { LinkService } from "@/service/link.service";
import z from "zod";
import { protectedProcedure, router } from "../lib/trpc";

export const linksRouter = router({
  getAll: protectedProcedure
    .input(queryLinksPayloadSchema)
    .query(({ input }) => {
      const linkService = getFromContainer(LinkService);
      return linkService.getLinks(input);
    }),
  create: protectedProcedure
    .input(createLinkPayloadSchema)
    .mutation(async ({ input, ctx }) => {
      const linkService = getFromContainer(LinkService);
      const link = await linkService.createLink(ctx.session.user.id, input);
      return { success: true, link };
    }),
  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const linkService = getFromContainer(LinkService);
      return linkService.getLinkBySlug(input.slug);
    }),
});
