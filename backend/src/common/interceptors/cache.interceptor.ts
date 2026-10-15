import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { RedisService } from "../../redis.service";
import { CACHE_SKIP_KEY, CACHE_TTL_KEY } from "../decorators/cache.decorator";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private redis: RedisService,
    private reflector: Reflector
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    if (this.reflector.get<boolean>(CACHE_SKIP_KEY, handler)) {
      return next.handle();
    }

    if (request.method !== "GET") return next.handle();

    const user = request.user;
    const ttl =
      this.reflector.get<number>(CACHE_TTL_KEY, handler) ??
      Number(process.env.CACHE_TTL ?? 60);
    const key = `cache:${request.url}:role=${user?.role ?? "anon"}:user=${user?.id ?? "anon"}`;

    const cached = await this.redis.get(key);
    if (cached) return of(JSON.parse(cached));

    return next.handle().pipe(
      tap((data) => {
        if (data !== null && data !== undefined) {
          void this.redis.set(key, JSON.stringify(data), ttl);
        }
      })
    );
  }
}
