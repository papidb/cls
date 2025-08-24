import { getFromContainer } from "@/app.container";
import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { LinkService } from "@/service/link.service";

export const linksRouter = router({
	getAll: publicProcedure.query(() => {
		const linkService = getFromContainer(LinkService);
		return linkService.getLinks({});
	}),
	create: protectedProcedure.mutation(() => {
		return { success: true };
	}),
});