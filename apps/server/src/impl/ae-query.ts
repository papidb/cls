// analytics-sql.ts
import { blobsMap, doublesMap, type LogsMap } from "@/utils/logs";

// ---------- helpers ----------
const sqlString = (v: string) => `'${v.replace(/'/g, "''")}'`;
const sqlIdent = (v: string) => v.replace(/[^a-zA-Z0-9_]/g, "");
const isBlobKey = (k: string): k is keyof typeof blobsMap => k in blobsMap;
const isDoubleKey = (k: string): k is keyof typeof doublesMap =>
  k in doublesMap;

// Map a dimension like "country" to blob6, "language" to blob10, etc.
export function dim(col: keyof LogsMap): string {
  if (
    isBlobKey(
      (Object.keys(blobsMap).find(
        (b) => blobsMap[b as keyof typeof blobsMap] === col
      ) || "") as any
    )
  ) {
    // Already validated, but we want blobN not "country"
    const entry = Object.entries(blobsMap).find(([, v]) => v === col)!;
    return entry[0]; // blobN
  }
  if (
    isDoubleKey(
      (Object.keys(doublesMap).find(
        (d) => doublesMap[d as keyof typeof doublesMap] === col
      ) || "") as any
    )
  ) {
    const entry = Object.entries(doublesMap).find(([, v]) => v === col)!;
    return entry[0]; // doubleN
  }
  //   if (col === "timestamp") return "timestamp";
  throw new Error(`Unknown dimension ${String(col)}`);
}

// ---------- query builder ----------
type OrderDir = "ASC" | "DESC";
type TimeUnit = "minute" | "hour" | "day" | "week";

export class AEQuery {
  private _selects: string[] = [];
  private _wheres: string[] = [];
  private _groupBy: string[] = [];
  private _orderBy: string[] = [];
  private _limit?: number;
  private _dataset: string;

  constructor(dataset = "link-clicks-production") {
    this._dataset = `'${dataset}'`;
  }

  // common aggregations
  sumSample(alias = "total") {
    this._selects.push(`SUM(_sample_interval) AS ${sqlIdent(alias)}`);
    return this;
  }

  countDistinct(col: keyof LogsMap, alias: string) {
    this._selects.push(`COUNT(DISTINCT ${dim(col)}) AS ${sqlIdent(alias)}`);
    return this;
  }

  rawSelect(expr: string) {
    this._selects.push(expr);
    return this;
  }

  selectDim(col: keyof LogsMap, alias?: string) {
    const d = dim(col);
    this._selects.push(alias ? `${d} AS ${sqlIdent(alias)}` : d);
    return this;
  }

  timeBucket(unit: TimeUnit, alias = "bucket") {
    this._selects.push(
      `DATE_TRUNC('${unit}', timestamp) AS ${sqlIdent(alias)}`
    );
    this._groupBy.push(sqlIdent(alias));
    this._orderBy.push(`${sqlIdent(alias)} ASC`);
    return this;
  }

  // filters
  whereEq(col: keyof LogsMap, value: string | number) {
    const dcol = dim(col);
    const lit =
      typeof value === "number" ? String(value) : sqlString(String(value));
    this._wheres.push(`${dcol} = ${lit}`);
    return this;
  }

  whereIn(col: keyof LogsMap, values: Array<string | number>) {
    if (!values.length) return this;
    const dcol = dim(col);
    const lits = values
      .map((v) => (typeof v === "number" ? String(v) : sqlString(String(v))))
      .join(", ");
    this._wheres.push(`${dcol} IN (${lits})`);
    return this;
  }

  whereTimeSince(days: number) {
    this._wheres.push(`timestamp >= NOW() - INTERVAL '${days}' DAY`);
    return this;
  }

  whereBetween(startIso: string, endIso: string) {
    this._wheres.push(
      `timestamp >= ${sqlString(startIso)} AND timestamp < ${sqlString(endIso)}`
    );
    return this;
  }

  // grouping, ordering, limiting
  groupBy(col: keyof LogsMap) {
    this._groupBy.push(dim(col));
    return this;
  }

  orderBy(colOrExpr: string, dir: OrderDir = "DESC") {
    this._orderBy.push(`${colOrExpr} ${dir}`);
    return this;
  }

  limit(n: number) {
    this._limit = Math.max(1, Math.min(n, 5000));
    return this;
  }

  build(): string {
    const select = this._selects.length
      ? this._selects.join(", ")
      : "SUM(_sample_interval) AS total";
    const where = this._wheres.length
      ? ` WHERE ${this._wheres.join(" AND ")}`
      : "";
    const group = this._groupBy.length
      ? ` GROUP BY ${this._groupBy.join(", ")}`
      : "";
    const order = this._orderBy.length
      ? ` ORDER BY ${this._orderBy.join(", ")}`
      : "";
    const limit = this._limit ? ` LIMIT ${this._limit}` : "";
    return `SELECT ${select} FROM ${this._dataset}${where}${group}${order}${limit}`;
  }
}
