import { TrafficMap } from "@/components/analytics/traffic-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { copyToClipboard } from "@/lib/string";
import { trpc } from "@/utils/trpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Copy,
  ExternalLink,
  Hash,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/links/$slug")({
  component: RouteComponent,
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        trpc.links.get.queryOptions({ slug: params.slug })
      ),
    ]),
});

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const timeRangeOptions = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
] as const;

function RouteComponent() {
  const { slug } = Route.useParams();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const link = useSuspenseQuery(trpc.links.get.queryOptions({ slug: slug }));

  const selectedOption = timeRangeOptions.find(
    (option) => option.value === timeRange
  )!;

  const timeSeries = useQuery(
    trpc.analytics.metrics.queryOptions({
      bucket: "hour", // one bucket per hour
      metrics: [{ kind: "clicks", alias: "clicks" }],
      filters: [
        { op: "eq", col: "slug", value: slug },
        { op: "sinceDays", days: selectedOption.days },
      ],
      orderBy: [{ expr: "bucket", dir: "ASC" }],
      limit: 24 * selectedOption.days,
    })
  );

  const geoData = useQuery(
    trpc.analytics.metrics.queryOptions({
      dimensions: [{ col: "country", alias: "country" }],
      metrics: [{ kind: "clicks", alias: "clicks" }],
      filters: [
        { op: "eq", col: "slug", value: slug },
        { op: "sinceDays", days: 30 },
      ],
      orderBy: [{ expr: "clicks", dir: "DESC" }],
      limit: 20,
    })
  );

  const trafficByCountry = useMemo(() => {
    if (!geoData.data) return {};
    return (
      geoData.data as unknown as { country: string; clicks: string }[]
    ).reduce((acc: Record<string, number>, item: any) => {
      // console.log(item)
      if (item.country) {
        acc[item.country] = item.clicks;
      }
      return acc;
    }, {});
  }, [geoData.data]);
  console.log({ trafficByCountry });

  const shortUrl = `${window.location.origin}/${link.data.slug}`;

  const copyShortUrl = () => {
    copyToClipboard(shortUrl);
  };

  const copyOriginalUrl = () => {
    copyToClipboard(link.data.url);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 gap-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link to="/links">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Links
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Click Analytics</CardTitle>
            <CardDescription>
              Click activity over the selected time period (hourly buckets)
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between">
                {selectedOption.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px]">
              {timeRangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={timeRange === option.value ? "bg-accent" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {timeSeries.data && timeSeries.data.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              {/* @ts-ignore can't tell why this is breaking ts, will fix.  */}
              <AreaChart data={timeSeries.data}>
                <defs>
                  <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-clicks)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-clicks)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) =>
                    new Date(value * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) =>
                        new Date(value * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      }
                      indicator="dot"
                    />
                  }
                />
                <Area
                  dataKey="clicks"
                  type="natural"
                  fill="url(#fillClicks)"
                  stroke="var(--color-clicks)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {timeSeries.isLoading
                ? "Loading analytics..."
                : "No click data available"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clicks by Country</CardTitle>
          <CardDescription>
            Geographic distribution of clicks over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {geoData.data && geoData.data.length > 0 ? (
            <TrafficMap trafficByCountry={trafficByCountry} />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              {geoData.isLoading
                ? "Loading geographic data..."
                : "No geographic data available"}
            </div>
          )}
        </CardContent>
      </Card>

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
