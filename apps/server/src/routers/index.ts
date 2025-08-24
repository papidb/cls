import { publicProcedure, router } from "../lib/trpc";
import { linksRouter } from "./links";

export const appRouter = router({
  health: publicProcedure.query(() => {
    return "OK";
  }),
  links: linksRouter,
});
export type AppRouter = typeof appRouter;
