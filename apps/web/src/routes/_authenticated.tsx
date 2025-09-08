import { authClient } from "@/lib/auth-client";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  // TODO: Remove and look for a better way to handle auth state
  useEffect(() => {
    if (!isPending && !session) {
      navigate({
        to: "/login",
        search: {
          redirect: window.location.href,
        },
        replace: true,
      });
    }
  }, [session, isPending, navigate]);

  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});
