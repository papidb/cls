import { env } from "cloudflare:workers";

export class CacheService {
  async get(key: string) {
    return await env.LINK_STORE.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    await env.LINK_STORE.put(key, value, {
      expirationTtl: ttl,
    });
  }

  async delete(key: string) {
    await env.LINK_STORE.delete(key);
  }
}
