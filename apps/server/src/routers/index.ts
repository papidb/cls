import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { linksRouter } from "./links";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	links: linksRouter,
});
export type AppRouter = typeof appRouter;
