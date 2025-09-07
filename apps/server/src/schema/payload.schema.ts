import { LOG_COLS } from "@/utils/logs";
import { DateTime } from "luxon";
import { z } from "zod";

export const createLinkPayloadSchema = z.object({
  url: z.url(),
  description: z.string().min(2).max(2024).optional(),
  slug: z.string().min(2).max(64),
  expiration: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const date = DateTime.fromISO(val);
      return date.isValid ? date.toJSDate() : undefined;
    })
    .refine((date) => {
      if (!date) return true;
      const tomorrow = DateTime.now().plus({ days: 1 }).startOf("day");
      return DateTime.fromJSDate(date) >= tomorrow;
    }, "Expiration must be at least one day in the future"),
});

export type CreateLinkPayload = z.infer<typeof createLinkPayloadSchema>;

export const queryLinksPayloadSchema = z
  .object({
    cursor: z.int().optional(),
    text: z.string().optional(),
    order: z.enum(["asc", "desc"]).default("asc"),
    size: z.number().min(1).max(100).default(100),
  })
  .optional();

export type QueryLinksPayload = z.infer<typeof queryLinksPayloadSchema>;

// strict enums
const logColEnum = z.enum(LOG_COLS);
const orderDirEnum = z.enum(["ASC", "DESC"]);
const bucketEnum = z.enum(["minute", "hour", "day", "week"]);

// metric kinds
const clicksMetric = z.object({
  kind: z.literal("clicks"),
  alias: z.string().trim().min(1).max(64).optional(),
});

const uniquesMetric = z.object({
  kind: z.literal("uniques"),
  on: logColEnum, // distinct on a known column
  alias: z.string().trim().min(1).max(64).optional(),
});

// We intentionally exclude a "raw" metric in the public API.
// If you need it internally, make a separate internal schema.

export const metricSchema = z.union([clicksMetric, uniquesMetric]);

// dimensions
const dimensionSchema = z.object({
  col: logColEnum,
  alias: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/) // safe SQL identifier
    .optional(),
});

// filters
const filterEq = z.object({
  op: z.literal("eq"),
  col: logColEnum,
  value: z.union([z.string(), z.number()]),
});

const filterIn = z.object({
  op: z.literal("in"),
  col: logColEnum,
  values: z
    .array(z.union([z.string(), z.number()]))
    .min(1)
    .max(1000),
});

const filterSinceDays = z.object({
  op: z.literal("sinceDays"),
  days: z.number().int().min(1).max(3650),
});

const filterBetweenTime = z
  .object({
    op: z.literal("betweenTime"),
    startIso: z.string().datetime(),
    endIso: z.string().datetime(),
  })
  .refine(
    (v) => new Date(v.startIso).getTime() < new Date(v.endIso).getTime(),
    { message: "startIso must be earlier than endIso" }
  );

export const filterSchema = z.union([
  filterEq,
  filterIn,
  filterSinceDays,
  filterBetweenTime,
]);

// order by only allows aliases or "bucket". We validate that after parsing.
const orderBySchema = z.object({
  expr: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  dir: orderDirEnum.optional(),
});

export const metricsRequestSchema = z
  .object({
    dimensions: z.array(dimensionSchema).max(8).optional(),
    metrics: z.array(metricSchema).min(1).max(8),
    bucket: bucketEnum.optional(),
    filters: z.array(filterSchema).max(16).optional(),
    orderBy: z.array(orderBySchema).max(8).optional(),
    limit: z.number().int().min(1).max(5000).optional(),
  })
  .superRefine((req, ctx) => {
    // Build the set of selectable aliases
    const aliasSet = new Set<string>();
    for (const d of req.dimensions || []) {
      aliasSet.add(d.alias || d.col); // dim alias or column name
    }
    if (req.bucket) aliasSet.add("bucket");
    for (const m of req.metrics) {
      if (m.kind === "clicks") aliasSet.add(m.alias || "clicks");
      if (m.kind === "uniques") aliasSet.add(m.alias || "uniques");
    }

    // Validate orderBy expressions exist among selected aliases
    for (const o of req.orderBy || []) {
      if (!aliasSet.has(o.expr)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `orderBy.expr "${o.expr}" must reference a selected alias or bucket`,
          path: ["orderBy"],
        });
      }
    }
  });

export type MetricsRequest = z.infer<typeof metricsRequestSchema>;
