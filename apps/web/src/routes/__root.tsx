import { Toaster } from "@/components/ui/sonner";

import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import Loader from "@/components/loader";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "../components/header";
import appCss from "../index.css?url";

import { ThemeProvider } from "@/components/theme-provider";
import type { QueryClient } from "@tanstack/react-query";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../server/src/routers";
import { seo } from "@/utils/seo";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "theme-color",
        content: "#0d0d0d",
      },
      ...seo({
        title: "CLS",
        description: `CLS is a url shortener hosted on cloudflare.`,
      }),
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "shortcut icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    ],
  }),

  component: RootDocument,
});

function RootDocument() {
  const isFetching = useRouterState({ select: (s) => s.isLoading });
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Update theme-color meta tag based on current theme
              function updateThemeColor() {
                const isDark = document.documentElement.classList.contains('dark');
                // Get the actual computed background color from CSS variables
                const computedStyle = getComputedStyle(document.documentElement);
                const bgColor = computedStyle.getPropertyValue('--background').trim();
                
                // Convert oklch to hex for meta tag
                let themeColor;
                if (isDark) {
                  themeColor = '#0d0d0d'; // oklch(0.05 0 0)
                } else {
                  themeColor = '#ffffff'; // oklch(1 0 0)
                }
                
                const metaTag = document.querySelector('meta[name="theme-color"]');
                if (metaTag) {
                  metaTag.setAttribute('content', themeColor);
                }
              }
              
              // Update on load
              updateThemeColor();
              
              // Watch for theme changes
              const observer = new MutationObserver(updateThemeColor);
              observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class']
              });
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          storageKey="vite-ui-theme"
        >
          <div className="min-h-screen">
            <Header />
            <main className="pt-16">
              {isFetching ? <Loader /> : <Outlet />}
            </main>
          </div>
        </ThemeProvider>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}
