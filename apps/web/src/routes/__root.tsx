import Header from "@/components/header";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">Error</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Something went wrong
          </p>
          <div className="text-sm text-muted-foreground/80 font-mono bg-muted/20 p-4 border border-border rounded-none">
            {error.message}
          </div>
        </div>
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full py-4 text-center block text-foreground border border-border hover:bg-muted/30 transition-colors text-base"
          >
            Go Home
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
  head: () => ({
    meta: [
      {
        title: "cls",
      },
      {
        name: "description",
        content: "cls is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="min-h-screen">
          <Header />
          <main className="pt-16">{isFetching ? <Loader /> : <Outlet />}</main>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
