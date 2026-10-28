import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Round coordinates to 4 decimal places (~11m precision) for efficient cache sharing
export function getCoordCacheKey(prefix: string, lat: number, lng: number) {
  return `localeproof:${prefix}:${lat.toFixed(4)}:${lng.toFixed(4)}`;
}