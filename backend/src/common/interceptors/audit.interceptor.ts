import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { PrismaService } from "../../prisma.service";
import { AUDIT_ACTION_KEY } from "../decorators/audit-log.decorator";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const handler = context.getHandler();
    const user = request.user;

    const action =
      this.reflector.get<string>(AUDIT_ACTION_KEY, handler) ??
      `${request.method}:${request.path}`;

    const requestId = Math.random().toString(36).slice(2);
    const start = Date.now();

    return next.handle().pipe(
      tap((result) => {
        const entity =
          (result as { id?: string } | null)?.id ?? request.params?.id ?? null;
        void this.prisma.auditLog.create({
          data: {
            action,
            userId: user?.id ?? null,
            infrastructureId: user?.infrastructureId ?? null,
            entity: this.extractEntityName(request.path),
            entityId: entity,
            ip:
              (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
              request.socket?.remoteAddress ??
              null,
            metadata: {
              requestId,
              durationMs: Date.now() - start,
              method: request.method,
              path: request.path,
              body: request.method === "POST" || request.method === "PUT" || request.method === "PATCH"
                ? JSON.stringify(request.body).slice(0, 2048)
                : undefined,
            },
          },
        });
      })
    );
  }

  private extractEntityName(path: string): string {
    const segment = path.split("/").filter(Boolean).pop() ?? "unknown";
    return segment.replace(/:[a-zA-Z]+/g, "");
  }
}
