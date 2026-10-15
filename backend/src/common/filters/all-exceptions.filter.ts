import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { captureException } from "../../config/sentry";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("AllExceptionsFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      typeof (exception as { getStatus?: () => number })?.getStatus === "function"
        ? (exception as { getStatus: () => number }).getStatus()
        : 500;

    const message =
      exception instanceof Error ? exception.message : "Erreur interne du serveur";

    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} — ${message}`, (exception as Error)?.stack);
      captureException(exception, { method: request.method, path: request.url, status });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
