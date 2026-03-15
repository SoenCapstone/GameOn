"use client";

import * as React from "react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ActivityEntity = "teams" | "leagues" | "matches" | "posts" | "messages";
type ActivityPeriod = "7d" | "30d" | "1y";

type ActivityPoint = {
  date: string;
  total: number;
};

type ActivityResponse = {
  entity: ActivityEntity;
  period: ActivityPeriod;
  points: ActivityPoint[];
};

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const entityOptions: Array<{ value: ActivityEntity; label: string }> = [
  { value: "teams", label: "Teams" },
  { value: "leagues", label: "Leagues" },
  { value: "matches", label: "Matches" },
  { value: "posts", label: "Posts" },
  { value: "messages", label: "Messages" },
];

const periodOptions: Array<{ value: ActivityPeriod; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "1y", label: "Last 1 year" },
];

const chartHeightClass = "h-[280px]";

function formatChartDate(value: string, period: ActivityPeriod): string {
  const date = new Date(value);

  if (period === "1y") {
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getEntityLabel(entity: ActivityEntity): string {
  return (
    entityOptions.find((option) => option.value === entity)?.label ?? entity
  );
}

function getPeriodLabel(period: ActivityPeriod): string {
  return (
    periodOptions.find((option) => option.value === period)?.label ?? period
  );
}

async function fetchActivitySeries(
  entity: ActivityEntity,
  period: ActivityPeriod,
  signal?: AbortSignal,
): Promise<ActivityResponse> {
  const response = await fetch(
    `/api/activity?entity=${entity}&period=${period}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load chart data.");
  }

  return response.json() as Promise<ActivityResponse>;
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [entity, setEntity] = React.useState<ActivityEntity>("matches");
  const [period, setPeriod] = React.useState<ActivityPeriod>("30d");
  const [points, setPoints] = React.useState<ActivityPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetchActivitySeries(entity, period, controller.signal)
      .then((data) => {
        setPoints(data.points);
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load chart data.";

        setError(message);
        setPoints([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [entity, period]);

  const chartTitle = `${getEntityLabel(entity)} activity`;
  const chartDescription = `${getPeriodLabel(period)} of ${getEntityLabel(entity).toLowerCase()}`;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>{chartDescription}</CardDescription>
        <CardAction className="flex flex-col gap-2 @[940px]/card:flex-row @[940px]/card:items-center">
          {isMobile ? (
            <>
              <Select
                value={entity}
                onValueChange={(value) => setEntity(value as ActivityEntity)}
              >
                <SelectTrigger
                  className="w-40"
                  size="sm"
                  aria-label="Select an activity metric"
                >
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {entityOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="rounded-lg"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as ActivityPeriod)}
              >
                <SelectTrigger
                  className="w-40"
                  size="sm"
                  aria-label="Select a period"
                >
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {periodOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="rounded-lg"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <ToggleGroup
                type="single"
                value={entity}
                onValueChange={(value) => {
                  if (value) {
                    setEntity(value as ActivityEntity);
                  }
                }}
                variant="outline"
                className="*:data-[slot=toggle-group-item]:px-4!"
              >
                {entityOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as ActivityPeriod)}
              >
                <SelectTrigger
                  className="w-40"
                  size="sm"
                  aria-label="Select a period"
                >
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {periodOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="rounded-lg"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {error ? (
          <div
            className={`text-muted-foreground flex ${chartHeightClass} items-center justify-center text-sm`}
          >
            {error}
          </div>
        ) : isLoading ? (
          <div
            className={`text-muted-foreground flex ${chartHeightClass} items-center justify-center`}
          >
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              className="size-6 animate-spin"
            />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className={`aspect-auto ${chartHeightClass} w-full`}
          >
            <AreaChart
              data={points}
              margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-total)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => formatChartDate(value, period)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      formatChartDate(String(value), period)
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="total"
                type="monotone"
                fill="url(#fillTotal)"
                stroke="var(--color-total)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
