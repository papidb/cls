# Cloudflare Link Shortener (cls)

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack),
It was inspired by my talk on [Building APIs on Cloudflare](https://cls.danielubenjamin.com/building-apis-on-cloudflare), and what is better way to show what cloudflare can do than build a url shortener.

## Features

- **Authentication**: Email & password authentication with [Better Auth](https://www.better-auth.com/)
- **Analytics**:  Click tracking and usage analytics with detailed reporting with Cloudflare [Workers analytics engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- **Database**: Cloudflare D1 with [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations
- **Server**: [Hono](https://hono.dev/) web framework with [tRPC](https://trpc.io/) for end-to-end type safety
- **Frontend**: React with [TanStack Router](https://tanstack.com/router) and [TailwindCSS](https://tailwindcss.com/)
- **Infrastructure**: Deployed on Cloudflare Workers with [Alchemy](https://alchemy.run/)
- **Validation**: [Zod](https://zod.dev/) for runtime type validation across client and server
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) components built on Radix UI primitives 

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Environment Setup

1. Copy the environment file template:
```bash
cp apps/server/.env.example apps/server/.env
```

2. Get your Cloudflare credentials from the [Cloudflare Dashboard](https://dash.cloudflare.com):
   - Account ID
   - API Token (with D1 permissions)

3. Update your `.env` file in the `apps/server` directory with your credentials.

## Database Setup

This project uses [D1](https://developers.cloudflare.com/d1/) with Drizzle ORM.

1. Generate and push database schema:
```bash
pnpm db:generate
pnpm db:push
```

2. The local D1 database will automatically start as part of the `wrangler dev` command.

Then, run the development server:

```bash
pnpm alchemy:dev
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

### Development
- `pnpm dev`: Start all applications in development mode
- `pnpm dev:web`: Start only the web application
- `pnpm dev:server`: Start only the server
- `pnpm alchemy:dev`: Start using Alchemy development mode

### Building & Deployment
- `pnpm build`: Build all applications
- `pnpm deploy`: Deploy to production using Alchemy
- `pnpm destroy`: Destroy deployed resources

### Database
- `pnpm db:generate`: Generate database schema migrations
<!-- - `pnpm db:push`: Push schema changes to database -->

### Code Quality
- `pnpm check-types`: Check TypeScript types across all apps

## Tech Stack

- **Frontend**: React 19, TanStack Router, TailwindCSS v4, shadcn/ui
- **Backend**: Hono, tRPC, Better Auth
- **Database**: Cloudflare D1, Drizzle ORM
- **Infrastructure**: Cloudflare Workers, Alchemy
- **Build Tools**: Vite, Turbo (monorepo), TypeScript
- **Package Manager**: pnpm

## Architecture

This is a monorepo using Turbo with two main applications:

- **`apps/web`**: React frontend with TanStack Router for navigation
- **`apps/server`**: Hono API server with tRPC endpoints

Both applications share type definitions through tRPC, ensuring end-to-end type safety.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

- OG Images are missing from generated URLs
- Analytics dashboard needs performance improvements

## License

This project is licensed under the MIT License.