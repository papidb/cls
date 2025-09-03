import { authClient } from "@/lib/auth-client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession();
    if (!data) {
      throw redirect({
        to: "/login",
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      });
    }
  },
  component: () => <Outlet />,
});
