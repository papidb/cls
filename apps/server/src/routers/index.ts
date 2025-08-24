import { publicProcedure, router } from "../lib/trpc";
import { analyticsRouter } from "./analytics";
import { linksRouter } from "./links";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return "OK";
  }),
  links: linksRouter,
  analytics: analyticsRouter,
});
export type AppRouter = typeof appRouter;
