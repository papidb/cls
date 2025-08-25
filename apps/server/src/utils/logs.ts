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
