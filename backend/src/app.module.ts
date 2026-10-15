import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { BullModule } from "@nestjs/bullmq";
import { CoreModule } from "./core.module";
import { MailModule } from "./mail/mail.module";
import { HealthModule } from "./health/health.module";
import { RolesGuard } from "./common/guards/roles.guard";
import { SubscriptionGuard } from "./common/guards/subscription.guard";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { CacheInterceptor } from "./common/interceptors/cache.interceptor";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "./modules/auth/auth.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { DoctorsModule } from "./modules/doctors/doctors.module";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { TeleconsultationModule } from "./modules/teleconsultation/teleconsultation.module";
import { PrescriptionsModule } from "./modules/prescriptions/prescriptions.module";
import { PharmaciesModule } from "./modules/pharmacies/pharmacies.module";
import { LaboratoriesModule } from "./modules/laboratories/laboratories.module";
import { InsuranceModule } from "./modules/insurance/insurance.module";
import { VaccinationModule } from "./modules/vaccination/vaccination.module";
import { PregnancyModule } from "./modules/pregnancy/pregnancy.module";
import { EmergencyModule } from "./modules/emergency/emergency.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { AiModule } from "./modules/ai/ai.module";
import { SearchModule } from "./modules/search/search.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NotificationWorker } from "./queues/notification.worker";
import { PdfWorker } from "./queues/pdf.worker";
import { BillingWorker } from "./queues/billing.worker";
import { SubscriptionCron } from "./cron/subscription.cron";

@Module({
  imports: [
    CoreModule,
    MailModule,
    HealthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          { name: "global", ttl: 60_000, limit: 100 },
          { name: "short", ttl: 1_000, limit: 10 },
        ],
      }),
    }),
    BullModule.registerQueue(
      { name: "notifications" },
      { name: "pdf" },
      { name: "billing" }
    ),
    ScheduleModule.forRoot(),
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    TeleconsultationModule,
    PrescriptionsModule,
    PharmaciesModule,
    LaboratoriesModule,
    InsuranceModule,
    VaccinationModule,
    PregnancyModule,
    EmergencyModule,
    NotificationsModule,
    DashboardModule,
    AiModule,
    SearchModule,
    BillingModule,
  ],
  providers: [
    CacheInterceptor,
    AuditInterceptor,
    NotificationWorker,
    PdfWorker,
    BillingWorker,
    SubscriptionCron,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: SubscriptionGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
