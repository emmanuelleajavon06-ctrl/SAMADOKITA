import { SetMetadata } from "@nestjs/common";

export const CACHE_TTL_KEY = "cacheTtl";
export const CACHE_SKIP_KEY = "cacheSkip";
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);
export const SkipCache = () => SetMetadata(CACHE_SKIP_KEY, true);
