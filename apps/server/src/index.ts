import { trpcServer } from "@hono/trpc-server";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { appRouter } from "./routers/index";

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

// copied over from https://github.com/craigsdennis/shorty-dot-dev/blob/931e6c142598377fe3b0e3ac648907c2f262517d/src/index.ts#L176C11-L176C12
app.get(":slug", async (c) => {
  const slug = c.req.param("slug");
  const link = await env.LINK_STORE.get(slug);
  if (link === null) {
    return c.status(404);
  }
  const url = JSON.parse(link).url as string;
  const cfProperties = c.req.raw.cf;
  if (cfProperties !== undefined) {
    if (env.ANALYTICS !== undefined) {
      env.ANALYTICS.writeDataPoint({
        blobs: [
          slug as string,
          url as string,
          cfProperties.city as string,
          cfProperties.country as string,
          cfProperties.continent as string,
          cfProperties.region as string,
          cfProperties.regionCode as string,
          cfProperties.timezone as string,
        ],
        doubles: [
          cfProperties.metroCode as number,
          cfProperties.longitude as number,
          cfProperties.latitude as number,
        ],
        indexes: [slug],
      });
    } else {
      console.warn(
        `ANALYTICS not defined (does not work on local dev), passing through ${slug} to ${url}`
      );
    }
  }
  // Redirect
  return c.redirect(url);
});

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

export default app;
