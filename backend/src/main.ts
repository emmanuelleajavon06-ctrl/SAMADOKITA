import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { initSentry, closeSentry } from "./config/sentry";

initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger("Bootstrap");
  app.useLogger(logger);

  const corsWhitelist = (process.env.CORS_ORIGINS ?? "http://localhost:3000").split(",");
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsWhitelist.includes(origin)) return callback(null, true);
      return callback(new Error("CORS bloqué"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "data:"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    })
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter(), new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle("SamaDokita V3 — API Nationale Santé Sénégal")
    .setDescription("Dossier Médical National — 800K utilisateurs, sécurité souveraine")
    .setVersion("3.0.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header", name: "Authorization" },
      "access-token"
    )
    .addTag("Auth")
    .addTag("Patients")
    .addTag("Appointments")
    .addTag("Billing")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  app.enableShutdownHooks();
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 SamaDokita backend prêt sur http://0.0.0.0:${port}`);
}

bootstrap().catch(async (err) => {
  // Capture les erreurs fatales de bootstrap dans Sentry
  const { captureException } = await import("./config/sentry");
  captureException(err, { phase: "bootstrap" });
  console.error(err);
  await closeSentry();
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void closeSentry().finally(() => process.exit(0));
  });
}
