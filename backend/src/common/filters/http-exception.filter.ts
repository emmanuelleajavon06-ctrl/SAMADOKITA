import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpExceptionFilter");

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const res = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        typeof res === "string"
          ? res
          : (res as { message?: string | string[] }).message ?? "Erreur interne",
      errors:
        typeof res === "object" && res !== null && "errors" in res
          ? (res as { errors: unknown }).errors
          : undefined,
    };

    if (status >= 500) this.logger.error(JSON.stringify(errorResponse));
    response.status(status).json(errorResponse);
  }
}
