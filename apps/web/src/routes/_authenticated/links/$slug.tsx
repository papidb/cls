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
import { getCountryISO3, type ISO2 } from "@/lib/country";
import { LinkDetails } from "@/sections/links/link-details";
import { trpc } from "@/utils/trpc";
import { Await, createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Suspense, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import z from "zod";

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const timeEnum = z.enum(["7d", "30d", "90d"]);
type Time = z.infer<typeof timeEnum>;
const timeToDays = (t: Time) => ({ "7d": 7, "30d": 30, "90d": 90 }[t]);

const timeNode = z.object({ time: timeEnum.catch("30d") });

export const searchSchema = z
  .object({
    timeSeries: timeNode.catch({ time: "30d" }), // controls the chart
    geo: timeNode
      .extend({ country: z.string().length(3).optional() })
      .catch({ time: "30d" }),
  })
  .default({ timeSeries: { time: "30d" }, geo: { time: "30d" } });

export type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/_authenticated/links/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => {
    const s = search as Search; // already parsed by validateSearch
    return {
      tsDays: timeToDays(s.timeSeries.time), // chart horizon
      geoDays: timeToDays(s.geo.time), // geo horizon
      geoCountry: s.geo.country ?? null, // selected country (optional)
    };
  },

  loader: async ({ context, params, deps }) => {
    const { slug } = params;
    const { tsDays, geoDays } = deps as { tsDays: number; geoDays: number };
    const linkPromise = context.queryClient.ensureQueryData(
      trpc.links.get.queryOptions({ slug })
    );

    const timeSeriesPromise = context.queryClient.ensureQueryData(
      trpc.analytics.metrics.queryOptions({
        bucket: "hour",
        metrics: [{ kind: "clicks", alias: "clicks" }],
        filters: [
          { op: "eq", col: "slug", value: slug },
          { op: "sinceDays", days: tsDays },
        ],
        orderBy: [{ expr: "bucket", dir: "ASC" }],
        limit: 24 * tsDays,
      })
    );
    const geoPromise = context.queryClient.ensureQueryData(
      trpc.analytics.metrics.queryOptions({
        dimensions: [{ col: "country", alias: "country" }],
        metrics: [{ kind: "clicks", alias: "clicks" }],
        filters: [
          { op: "eq", col: "slug", value: slug },
          { op: "sinceDays", days: geoDays },
        ],
        orderBy: [{ expr: "clicks", dir: "DESC" }],
        limit: 20,
      })
    );

    const link = await linkPromise;

    return {
      link, // resolved
      timeSeries: timeSeriesPromise, // deferred
      geo: geoPromise, // deferred
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch() as Search;
  const navigate = Route.useNavigate();
  const data = Route.useLoaderData() as {
    link: Awaited<ReturnType<typeof trpc.links.get.queryFn>>;
    timeSeries: Promise<Array<{ bucket: number; clicks: number }>>;
    geo: Promise<Array<{ country: string; clicks: number }>>;
  };
  console.log({data})

  // deep-updaters that preserve other keys
  const setTimeSeriesTime = (next: Time) =>
    navigate({
      replace: true,
      search: (prev: Search) => ({
        ...prev,
        timeSeries: { ...(prev.timeSeries ?? {}), time: next },
      }),
    });

  const setGeoTime = (next: Time) =>
    navigate({
      replace: true,
      search: (prev: Search) => ({
        ...prev,
        geo: { ...(prev.geo ?? {}), time: next },
      }),
    });

  // UI selections

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 gap-6">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link
            to="/links"
            search={(prev: Search) => ({
              ...prev,
              timeSeries: prev.timeSeries,
            })}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Links
          </Link>
        </Button>
      </div>

      <LinkDetails link={data.link} />
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Click Analytics</CardTitle>
            <CardDescription>
              Click activity over the selected time period (hourly buckets)
            </CardDescription>
          </div>

          {/* Time range control writes to URL */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[160px] justify-between">
                {
                  (
                    {
                      "7d": "Last 7 days",
                      "30d": "Last 30 days",
                      "90d": "Last 90 days",
                    } as const
                  )[search.timeSeries.time]
                }
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[160px]">
              {(["7d", "30d", "90d"] as const).map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => setTimeSeriesTime(opt)}
                  className={search.timeSeries.time === opt ? "bg-accent" : ""}
                >
                  {
                    (
                      {
                        "7d": "Last 7 days",
                        "30d": "Last 30 days",
                        "90d": "Last 90 days",
                      } as const
                    )[opt]
                  }
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading analytics…
              </div>
            }
          >
            <Await promise={data.timeSeries}>
              {(series: Array<{ bucket: number; clicks: number }>) => {
                console.log({series})
                return series?.length ? (
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                  >
                    {/* @ts-ignore */}
                    <AreaChart data={series}>
                      <defs>
                        <linearGradient
                          id="fillClicks"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
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
                        tickFormatter={(v) =>
                          new Date(v * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(v) =>
                              new Date(v * 1000).toLocaleDateString("en-US", {
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
                    No click data available
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </CardContent>
      </Card>

      {/* Card 2: Geo — deferred */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks by Country</CardTitle>
          <CardDescription>
            Geographic distribution of clicks over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading geographic data…
              </div>
            }
          >
            <Await promise={data.geo}>
              {(rows: Array<{ country: string; clicks: number }>) => {
                const trafficByCountry = useMemo(() => {
                  return (rows ?? []).reduce(
                    (acc: Record<string, number>, item) => {
                      if (item.country)
                        acc[getCountryISO3(item.country as ISO2)] = Number(
                          item.clicks
                        );
                      return acc;
                    },
                    {}
                  );
                }, [rows]);
                return rows?.length ? (
                  <TrafficMap trafficByCountry={trafficByCountry} />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    No geographic data available
                  </div>
                );
              }}
            </Await>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
