import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { Worker, WranglerJson } from "alchemy/cloudflare";
import { D1Database } from "alchemy/cloudflare";
import { Exec } from "alchemy/os";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "./apps/web/.env" });
config({ path: "./apps/server/.env" });

const app = await alchemy("cls");

await Exec("db-generate", {
	cwd: "apps/server",
	command: "pnpm run db:generate",
});

const db = await D1Database("database", {
	name: `${app.name}-${app.stage}-db`,
	migrationsDir: "apps/server/src/db/migrations",
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
});

export const server = await Worker("server", {
	cwd: "apps/server",
	name: `${app.name}-${app.stage}`,
	entrypoint: "src/index.ts",
	compatibility: "node",
	bindings: {
		DB: db,
		CORS_ORIGIN: process.env.CORS_ORIGIN || "",
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "",
	},
	dev: {
		port: 3000,
	},
});

await WranglerJson("wrangler", {
	worker: server,
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
