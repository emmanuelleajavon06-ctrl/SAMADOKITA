import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../common/decorators/public.decorator";
import { SkipCache } from "../common/decorators/cache.decorator";
import { PrismaService } from "../prisma.service";
import { RedisService } from "../redis.service";
import { MinioService } from "../minio.service";

interface CheckResult {
  status: "up" | "down";
  latencyMs: number;
  detail?: string;
}

@Controller()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private minio: MinioService
  ) {}

  @Public()
  @SkipCache()
  @Get("health")
  async health() {
    const started = Date.now();
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      storage: await this.checkStorage(),
    };
    const healthy = Object.values(checks).every((c) => c.status === "up");
    const payload = {
      status: healthy ? "ok" : "degraded",
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - started,
      checks,
    };
    if (!healthy) throw new ServiceUnavailableException(payload);
    return payload;
  }

  @Public()
  @SkipCache()
  @Get("health/live")
  live() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Public()
  @SkipCache()
  @Get("health/ready")
  async ready() {
    const db = await this.checkDatabase();
    if (db.status !== "up") throw new ServiceUnavailableException({ status: "not-ready", checks: { database: db } });
    return { status: "ready", timestamp: new Date().toISOString() };
  }

  private async checkDatabase(): Promise<CheckResult> {
    const t = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "up", latencyMs: Date.now() - t };
    } catch (err) {
      return { status: "down", latencyMs: Date.now() - t, detail: (err as Error).message };
    }
  }

  private async checkRedis(): Promise<CheckResult> {
    const t = Date.now();
    try {
      const pong = await this.redis.raw.ping();
      return { status: pong === "PONG" ? "up" : "down", latencyMs: Date.now() - t };
    } catch (err) {
      return { status: "down", latencyMs: Date.now() - t, detail: (err as Error).message };
    }
  }

  private async checkStorage(): Promise<CheckResult> {
    const t = Date.now();
    try {
      await this.minio.ping();
      return { status: "up", latencyMs: Date.now() - t };
    } catch (err) {
      return { status: "down", latencyMs: Date.now() - t, detail: (err as Error).message };
    }
  }
}
