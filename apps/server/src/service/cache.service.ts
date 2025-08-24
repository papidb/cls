import { env } from "cloudflare:workers";

export class CacheService {
  async get(key: string) {
    return await env.LINK_STORE.get(key);
  }

  async set(key: string, value: string) {
    await env.LINK_STORE.put(key, value);
  }

  async delete(key: string) {
    await env.LINK_STORE.delete(key);
  }
}
