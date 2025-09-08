import { CreateLinkForm } from "@/components/links/create-link-form";
import { PreviewLink } from "@/components/links/single-link";
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

export const Route = createFileRoute("/_authenticated/links/")({
  component: RouteComponent,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(trpc.links.getAll.queryOptions()),
});

function RouteComponent() {
  const links = useSuspenseQuery(trpc.links.getAll.queryOptions());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const closeCreateLink = () => {
    setIsSheetOpen(false);
    links.refetch();
  };

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="container mx-auto max-w-3xl space-y-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-wide text-foreground">
            Your Links
          </h1>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button className="px-6 py-2 text-sm font-light border border-border hover:bg-muted/30 transition-colors tracking-wide">
                <Plus className="mr-2 h-3 w-3" />
                New Link
              </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader className="space-y-4 text-left">
                <SheetTitle className="text-xl font-light tracking-wide">
                  Create New Link
                </SheetTitle>
                <SheetDescription className="text-sm font-light text-muted-foreground leading-relaxed">
                  Create a shortened link with optional description and
                  expiration.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-8 px-4">
                <CreateLinkForm onSuccess={closeCreateLink} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-8">
          {links.data && links.data.length > 0 ? (
            <div className="space-y-6">
              {links.data.map((link) => (
                <PreviewLink key={link.id} link={link} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 space-y-6">
              <p className="text-base font-light text-muted-foreground">
                No links created yet
              </p>
              <button
                className="px-8 py-3 text-sm font-light border border-border hover:bg-muted/30 transition-colors tracking-wide"
                onClick={() => setIsSheetOpen(true)}
              >
                Create your first link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
