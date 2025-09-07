import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Link as LinkType } from "@/entities";
import { copyToClipboard } from "@/lib/string";
import { Calendar, Copy, ExternalLink, Hash, User } from "lucide-react";

export function LinkDetails({ link }: { link: LinkType }) {
  const shortUrl = `${window.location.origin}/${link.slug}`;

  const copyShortUrl = () => {
    copyToClipboard(shortUrl);
  };

  const copyOriginalUrl = () => {
    copyToClipboard(link.url);
  };
  return (
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
                <a href={shortUrl} target="_blank" rel="noopener noreferrer">
                  <Hash className="h-4 w-4" />
                </a>
                Short URL
              </label>
              <div className="flex items-center gap-2">
                <a
                  className="pointer"
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                    {shortUrl}
                  </code>
                </a>
                <Button size="sm" variant="outline" onClick={copyShortUrl}>
                  <Copy className="h-4 w-4" />
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
                  {link.url}
                </code>
                <Button size="sm" variant="outline" onClick={copyOriginalUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {link.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <p className="px-3 py-2 bg-muted rounded text-sm">
                  {link.description}
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
                {link.userId}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created At
              </label>
              <p className="px-3 py-2 bg-muted rounded text-sm">
                {new Date(link.createdAt).toLocaleString()}
              </p>
            </div>

            {link.expiration && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expires At
                </label>
                <p className="px-3 py-2 bg-muted rounded text-sm">
                  {new Date(link.expiration).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Updated
              </label>
              <p className="px-3 py-2 bg-muted rounded text-sm">
                {new Date(link.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
