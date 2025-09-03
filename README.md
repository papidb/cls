# Cloudflare Link Shortener (cls)

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack),
It was inspired by my talk on [Building APIs on Cloudflare](https://cls.danielubenjamin.com/building-apis-on-cloudflare), and what is better way to show what cloudflare can do than build a url shortener.

## Features

- **Authentication**: Email & password authentication with [Better Auth](https://www.better-auth.com/)
- Analytics: 
- Database: 
- Server:
- Frontend: 

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses [D1](https://developers.cloudflare.com/d1/) with Drizzle ORM.

1. Start the local D1 database:
Local development for a Cloudflare D1 database will already be running as part of the `wrangler dev` command.

2. Grab your cloudflare Token and account ID from the [dashboard](dash.cloudflare.com)_.

3. Update your `.env` file in the `apps/server` directory with the your cloudflare api token and account id.

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Project Structure

```bash
cls/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Hono, TRPC)
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:studio`: Open database studio UI
- `cd apps/server && pnpm db:local`: Start the local SQLite database

## Limitations

OG Images are missing from generated urls. 