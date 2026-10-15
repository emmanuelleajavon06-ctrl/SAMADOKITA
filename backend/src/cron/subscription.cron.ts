import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma.service";
import { QueueService } from "../queues/queue.service";

@Injectable()
export class SubscriptionCron {
  private logger = new Logger("SubscriptionCron");

  constructor(
    private prisma: PrismaService,
    private queue: QueueService
  ) {}

  // Quotidien à 00:00
  @Cron("0 0 * * *")
  async suspendExpiredSubscriptions() {
    const now = new Date();
    const expired = await this.prisma.infrastructure.findMany({
      where: {
        subscriptionEndsAt: { lt: now },
        subscriptionStatus: { notIn: ["SUSPENDED", "CANCELED"] },
      },
      include: { users: { where: { role: "ADMIN_INFRA" } } },
    });

    for (const infra of expired) {
      await this.prisma.infrastructure.update({
        where: { id: infra.id },
        data: { subscriptionStatus: "SUSPENDED" },
      });
      this.logger.warn(`Infra suspendue: ${infra.name} (${infra.id})`);

      for (const admin of infra.users) {
        await this.queue.enqueueNotification({
          userId: admin.id,
          title: "Abonnement suspendu",
          message: `Votre abonnement ${infra.subscriptionPlan} a expiré. Renouvelez pour réactiver l'accès.`,
          type: "BILLING",
        });
      }
    }

    // Transition TRIALING -> PAST_DUE si essai expiré
    const trialsExpired = await this.prisma.infrastructure.findMany({
      where: {
        subscriptionStatus: "TRIALING",
        trialEndsAt: { lt: now },
        subscriptionEndsAt: { gte: now },
      },
    });
    for (const infra of trialsExpired) {
      await this.prisma.infrastructure.update({
        where: { id: infra.id },
        data: { subscriptionStatus: "PAST_DUE" },
      });
    }
    this.logger.log(`Cron abonnement: ${expired.length} suspendue(s), ${trialsExpired.length} essai(s) expiré(s)`);
  }
}
