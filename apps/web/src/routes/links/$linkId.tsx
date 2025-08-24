import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { copyToClipboard } from "@/lib/string";
import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Copy,
  ExternalLink,
  Hash,
  User,
} from "lucide-react";

export const Route = createFileRoute("/links/$linkId")({
  component: RouteComponent,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        trpc.links.get.queryOptions({ id: params.linkId })
      ),
      context.queryClient.ensureQueryData(
        trpc.analytics.get.queryOptions({ id: params.linkId })
      ),
    ]),
});

function RouteComponent() {
  const { linkId } = Route.useParams();
  const link = useSuspenseQuery(trpc.links.get.queryOptions({ id: linkId }));
  const analytics = useSuspenseQuery(trpc.analytics.get.queryOptions({ id: linkId }));
  console.log(analytics.data)

  const shortUrl = `${import.meta.env.VITE_SERVER_URL}/${link.data.slug}`;

  const copyShortUrl = () => {
    copyToClipboard(shortUrl);
  };

  const copyOriginalUrl = () => {
    copyToClipboard(link.data.url);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Link Details</CardTitle>
              <CardDescription>
                View and manage your shortened link
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Short URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                    {shortUrl}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyShortUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Original URL
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm break-all">
                    {link.data.url}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyOriginalUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {link.data.description && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <p className="px-3 py-2 bg-muted rounded text-sm">
                    {link.data.description}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Created By
                </label>
                <p className="px-3 py-2 bg-muted rounded text-sm">
                  {link.data.userId}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created At
                </label>
                <p className="px-3 py-2 bg-muted rounded text-sm">
                  {new Date(link.data.createdAt).toLocaleString()}
                </p>
              </div>

              {link.data.expiration && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expires At
                  </label>
                  <p className="px-3 py-2 bg-muted rounded text-sm">
                    {new Date(link.data.expiration).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </label>
                <p className="px-3 py-2 bg-muted rounded text-sm">
                  {new Date(link.data.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
