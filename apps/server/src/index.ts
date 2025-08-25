import { trpcServer } from "@hono/trpc-server";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { getFromContainer } from "./app.container";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";
import { AnalyticsService } from "./service/analytics.service";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  })
);

app.get("/", (c) => {
  return c.text("OK");
});

// copied over from https://github.com/craigsdennis/shorty-dot-dev/blob/931e6c142598377fe3b0e3ac648907c2f262517d/src/index.ts#L176C11-L176C12
app.get(":slug", async (c) => {
  const slug = c.req.param("slug");
  const l = await env.LINK_STORE.get(slug);
  if (l === null) {
    return c.status(404);
  }
  const link = JSON.parse(l);
  const url = link.url as string;

  const analyticsService = getFromContainer(AnalyticsService);
  await analyticsService.write(c, { id: link.id, slug, url });

  // Redirect
  return c.redirect(url);
});

export default app;
