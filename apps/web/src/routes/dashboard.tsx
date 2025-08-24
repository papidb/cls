import { CreateLinkForm } from "@/components/links/create-link-form";
import { PreviewLink } from "@/components/links/single-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(trpc.links.getAll.queryOptions()),
});

function RouteComponent() {
  const links = useSuspenseQuery(trpc.links.getAll.queryOptions());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create New Link</SheetTitle>
              <SheetDescription>
                Create a new shortened link with optional description and
                expiration.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-4">
              <CreateLinkForm onSuccess={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Links</h2>
        {links.data && links.data.length > 0 ? (
          <div className="grid gap-4">
            {links.data.map((link) => (
              <PreviewLink key={link.id} link={link} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No links created yet.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsSheetOpen(true)}
            >
              Create your first link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
