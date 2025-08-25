export const getFlag = (cc?: string) => {
  if (!cc || cc.length !== 2) return "";
  const A = 127397;
  const up = cc.toUpperCase();
  return String.fromCodePoint(up.charCodeAt(0) + A, up.charCodeAt(1) + A);
};

export const firstIp = (hdr?: string | null) =>
  (hdr || "").split(",")[0]?.trim() || "";

const toBlobNumber = (blob: string) => +blob.replace(/\D/g, "");

export const blobsMap = {
  blob1: "slug",
  blob2: "url",
  blob3: "ua",
  blob4: "ip",
  blob5: "referer",
  blob6: "country",
  blob7: "region",
  blob8: "city",
  blob9: "timezone",
  blob10: "language",
  blob11: "os",
  blob12: "browser",
  blob13: "browserType",
  blob14: "device",
  blob15: "deviceType",
  blob16: "COLO",
} as const;

export const doublesMap = {
  double1: "latitude",
  double2: "longitude",
} as const;

export type BlobsMap = typeof blobsMap;
export type BlobsKey = keyof BlobsMap;
export type DoublesMap = typeof doublesMap;
export type DoublesKey = keyof DoublesMap;
export type LogsKey = BlobsMap[BlobsKey] | DoublesMap[DoublesKey];
export type LogsMap = {
  [key in BlobsMap[BlobsKey]]: string | undefined;
} & {
  [key in DoublesMap[DoublesKey]]?: number | undefined;
};

export const logsMap = {
  ...Object.entries(blobsMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {}),
  ...Object.entries(doublesMap).reduce(
    (acc, [k, v]) => ({ ...acc, [v]: k }),
    {}
  ),
} as unknown as LogsMap;

export function logs2blobs(logs: LogsMap) {
  return (Object.keys(blobsMap) as BlobsKey[])
    .sort((a, b) => toBlobNumber(a) - toBlobNumber(b))
    .map((key) => String(logs[blobsMap[key] as LogsKey] || ""));
}

export function blobs2logs(blobs: string[]) {
  const logsList = Object.keys(blobsMap);
  return blobs.reduce((logs, blob, i) => {
    const key = blobsMap[logsList[i] as BlobsKey];
    logs[key] = blob;
    return logs;
  }, {} as Partial<LogsMap>);
}

export function logs2doubles(logs: LogsMap) {
  return (Object.keys(doublesMap) as DoublesKey[])
    .sort((a, b) => toBlobNumber(a) - toBlobNumber(b))
    .map((key) => Number(logs[doublesMap[key] as LogsKey] || 0));
}

export function doubles2logs(doubles: number[]) {
  const logsList = Object.keys(doublesMap);
  return doubles.reduce((logs, double, i) => {
    const key = doublesMap[logsList[i] as DoublesKey];
    logs[key] = double;
    return logs;
  }, {} as Partial<LogsMap>);
}

// @ts-expect-error
export const LOG_COLS = Array.from(
  new Set([...Object.values(blobsMap), ...Object.values(doublesMap)])
) as const;

// string literal union type of all valid logical columns
export type LogCol = (typeof LOG_COLS)[number];

// helper to map logical column -> physical column name
export function toPhysical(col: LogCol): string {
  // if (col === "timestamp") return "timestamp";
  const b = Object.entries(blobsMap).find(([, v]) => v === col);
  if (b) return b[0];
  const d = Object.entries(doublesMap).find(([, v]) => v === col);
  if (d) return d[0];
  // should never happen if LOG_COLS is built from maps
  throw new Error(`Unknown column ${col}`);
}
