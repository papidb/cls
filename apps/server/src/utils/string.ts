import { customAlphabet } from "nanoid";

export const nanoid = (len = 6) => customAlphabet("abcdefghijklmnopqrstuvwxyz", len);
export function generateSlug() {
  return nanoid();
}
