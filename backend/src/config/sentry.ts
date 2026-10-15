import * as Sentry from "@sentry/node";

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    release: `samadokita@${process.env.APP_VERSION ?? "3.0.0"}`,
    integrations: [Sentry.httpIntegration()],
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    beforeSend(event) {
      // Ne jamais envoyer d'en-têtes ni de tokens
      if (event.request) {
        delete event.request.headers;
        delete event.request.cookies;
        if (event.request.query_string) event.request.query_string = undefined;
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
    Sentry.captureException(err);
  });
}

export function closeSentry(): Promise<boolean> {
  if (!initialized) return Promise.resolve(false);
  return Sentry.close(2000);
}
