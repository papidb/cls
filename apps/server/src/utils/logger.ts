// https://github.com/cloudflare/workers-sdk/issues/6841#issuecomment-2816283419
import { pino } from "pino";

export const logger = pino({
  browser: {
    asObject: true,
    // Add this (stringify the output before logging it)
    write: (o) => {
      console.log(JSON.stringify(o));
    },
  },
});
