import alchemy from "alchemy";
import {
  AnalyticsEngineDataset,
  D1Database,
  KVNamespace,
  Vite,
  Worker,
  WranglerJson,
} from "alchemy/cloudflare";
import { Exec } from "alchemy/os";
import { config } from "dotenv";

const stage = process.env.STAGE ?? "local";

const webDomain = "cls.danielubenjamin.com";
const apiDomain = "api.cls.danielubenjamin.com";

config({ path: "./.env" });
config({ path: "./apps/web/.env" });
config({ path: "./apps/server/.env" });

if (stage === "production") {
  config({ path: "./apps/web/.env.production" });
  config({ path: "./apps/server/.env.production" });
}

const app = await alchemy("cls", {
  stage,
});

await Exec("db-generate", {
  cwd: "apps/server",
  command: "pnpm run db:generate",
});

const db = await D1Database("database", {
  name: `${app.name}-${app.stage}-db`,
  migrationsDir: "apps/server/src/db/migrations",
});

const linkStore = await KVNamespace("link-store", {
  title: `link-store-${app.stage}`,
});

const analytics = AnalyticsEngineDataset("analytics", {
  dataset: `analytics-dataset-${app.stage}`,
});

export const server = await Worker("server", {
  cwd: "apps/server",
  name: `${app.name}-${app.stage}`,
  entrypoint: "src/index.ts",
  compatibility: "node",
  apiToken: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN),
  bindings: {
    DB: db,
    LINK_STORE: linkStore,
    ANALYTICS: analytics,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "",
    BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
    CLOUDFLARE_API_TOKEN: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN),
    CLOUDFLARE_ACCOUNT_ID: alchemy.secret(process.env.CLOUDFLARE_ACCOUNT_ID),
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "",
  },
  dev: {
    port: 3000,
  },
  domains: [apiDomain],
});

export const web = await Vite("web", {
  cwd: "apps/web",
  name: `${app.name}-${app.stage}-web`,
  assets: "dist",
  bindings: {
    VITE_SERVER_URL: process.env.VITE_SERVER_URL || "",
  },
  dev: {
    command: "pnpm run dev",
  },
  domains: [webDomain],
});

await WranglerJson("wrangler", {
  worker: server,
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
