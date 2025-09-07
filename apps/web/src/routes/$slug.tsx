import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/$slug")({
  beforeLoad: ({ params, location }) => {
    const base = (import.meta.env.VITE_SERVER_URL || "").replace(/\/+$/, "");
    if (!base) throw new Error("VITE_SERVER_URL is not set");
    console.log("server");
    const url = new URL(`${base}/${params.slug}`);
    if (location.searchStr) {
      new URLSearchParams(location.searchStr).forEach((v, k) =>
        url.searchParams.set(k, v)
      );
    }
    if (location.hash) url.hash = location.hash;

    throw redirect({ href: url.toString(), replace: true });
  },
  ssr: true,
  component: () => null,
});
