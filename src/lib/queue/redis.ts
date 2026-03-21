import type { RedisOptions } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379";

function parseRedisUrl(url: string): RedisOptions {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      db: parseInt(parsed.pathname.replace(/^\//, "") || "0", 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    console.warn("[Redis] Could not parse REDIS_URL, using defaults");
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}

export function getRedisConnection(): RedisOptions {
  return parseRedisUrl(redisUrl);
}

export function createRedisConnection(): RedisOptions {
  return parseRedisUrl(redisUrl);
}
