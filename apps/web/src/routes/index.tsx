import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">Link Shortener</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Create short, memorable links
          </p>
        </div>

        <div className="space-y-8">
          <Link
            to="/links"
            className="w-full py-4 text-foreground border border-border hover:bg-muted/30 transition-colors text-base"
          >
            Create Link
          </Link>
        </div>
      </div>
    </div>
  );
}
