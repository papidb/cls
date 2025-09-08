import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Calendar,
  Clock,
  Copy,
  ExternalLink,
  Hash,
  User,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import type { Link as LinkType } from "@/entities";
import { copyToClipboard } from "@/lib/string";

function formatDate(d: string | number | Date) {
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getFavicon(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return undefined;
  }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 h-9"
            onClick={() => copyToClipboard(value)}
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy {label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CodeField({
  value,
  asLink,
  ariaLabel,
}: {
  value: string;
  asLink?: boolean;
  ariaLabel?: string;
}) {
  const content = (
    <code
      className="block w-full px-3 py-2 rounded-md border bg-muted/50 text-sm font-mono leading-relaxed
                 border-border/50 hover:border-border transition-colors overflow-hidden text-ellipsis"
      aria-label={ariaLabel}
      title={value}
    >
      {value}
    </code>
  );

  if (!asLink) return content;

  return (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring rounded-md"
    >
      {content}
    </a>
  );
}

function MetaRow({
  icon,
  label,
  value,
  code,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  code?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/30 border-border/50 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {code ? (
        <code
          className="text-sm font-mono text-muted-foreground truncate max-w-[60%]"
          title={value}
        >
          {value}
        </code>
      ) : (
        <span
          className="text-sm text-muted-foreground truncate max-w-[60%]"
          title={value}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export function LinkDetails({ link }: { link: LinkType }) {
  // Safe short URL for SSR
  const origin =
    typeof window !== "undefined" && window?.location?.origin
      ? window.location.origin
      : "";
  const shortUrl = origin ? `${origin}/${link.slug}` : `/{slug:${link.slug}}`;

  const isExpired = !!link.expiration && new Date(link.expiration) < new Date();

  const isExpiringSoon =
    !!link.expiration &&
    new Date(link.expiration) <
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
    !isExpired;

  const status = useMemo(() => {
    if (isExpired) return { label: "Expired", variant: "destructive" as const };
    if (isExpiringSoon)
      return { label: "Expires Soon", variant: "secondary" as const };
    return { label: "Active", variant: "outline" as const };
  }, [isExpired, isExpiringSoon]);

  const favicon = getFavicon(link.url);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Link Details
            </CardTitle>
            <CardDescription className="text-base">
              View and manage your shortened link
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => window?.open(shortUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open short URL in a new tab</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Hosted on Cloudflare</span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-8">
          {/* URLs and Description */}
          <div className="space-y-6">
            {/* Short URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Hash className="h-4 w-4 text-blue-500" />
                Short URL
              </div>
              <div className="flex items-center gap-2">
                <CodeField value={shortUrl} asLink ariaLabel="Short URL" />
                <CopyButton value={shortUrl} label="short URL" />
              </div>
            </div>

            {/* Original URL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ExternalLink className="h-4 w-4 text-green-500" />
                Original URL
              </div>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="px-3 py-2 rounded-md border bg-muted/50 text-sm font-mono leading-relaxed break-all max-h-28 overflow-y-auto">
                    {link.url}
                  </div>
                </div>
                <CopyButton value={link.url} label="original URL" />
              </div>
            </div>

            {/* Description */}
            {link.description ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold">Description</div>
                <div className="px-3 py-2 rounded-md border bg-muted/50 text-sm border-border/50 leading-relaxed">
                  {link.description}
                </div>
              </div>
            ) : null}
          </div>

          {/* Metadata */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Metadata</h3>
            </div>
            <Separator />

            <div className="space-y-3">
              <MetaRow
                icon={<User className="h-4 w-4 text-purple-500" />}
                label="Created By"
                value={link.userId ?? "—"}
                code
              />
              <MetaRow
                icon={<Calendar className="h-4 w-4 text-blue-500" />}
                label="Created At"
                value={formatDate(link.createdAt)}
              />
              <MetaRow
                icon={<Clock className="h-4 w-4 text-orange-500" />}
                label="Last Updated"
                value={formatDate(link.updatedAt)}
              />

              {link.expiration ? (
                <div
                  className={[
                    "flex items-center justify-between rounded-md p-3 border",
                    isExpired
                      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      : isExpiringSoon
                      ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                      : "bg-muted/30 border-border/50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar
                      className={[
                        "h-4 w-4",
                        isExpired
                          ? "text-red-500"
                          : isExpiringSoon
                          ? "text-yellow-500"
                          : "text-green-500",
                      ].join(" ")}
                    />
                    <span className="text-sm font-medium">
                      {isExpired ? "Expired" : "Expires At"}
                    </span>
                  </div>
                  <span
                    className={[
                      "text-sm",
                      isExpired
                        ? "text-red-700 dark:text-red-300"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {formatDate(link.expiration)}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
