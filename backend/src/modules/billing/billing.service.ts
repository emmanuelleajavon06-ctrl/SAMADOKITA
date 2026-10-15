import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { QueueService } from "../../queues/queue.service";
import { SubscriptionPlan, PaymentProvider } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService
  ) {}

  async createSubscription(infraId: string, plan: SubscriptionPlan, provider: PaymentProvider) {
    const plans: Record<SubscriptionPlan, { amount: number; maxUsers: number; maxPatients: number }> = {
      STARTER: { amount: 20000, maxUsers: 5, maxPatients: 500 },
      PROFESSIONAL: { amount: 35000, maxUsers: 20, maxPatients: 5000 },
      ENTERPRISE: { amount: 75000, maxUsers: 999999, maxPatients: 999999 },
    };

    const p = plans[plan];
    const transactionId = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    const history = await this.prisma.subscriptionHistory.create({
      data: {
        infrastructureId: infraId,
        plan,
        amount: p.amount,
        provider,
        status: "PENDING",
        transactionId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // En production: rediriger vers le provider de paiement (Wave, Orange Money, etc.)
    // Ici on simule le webhook pour les écoles
    return { transactionId, historyId: history.id, amount: p.amount, checkoutUrl: `/api/billing/checkout/${history.id}` };
  }

  async confirmPayment(transactionId: string) {
    const history = await this.prisma.subscriptionHistory.findFirst({
      where: { transactionId },
    });
    if (!history) return { error: "Transaction introuvable" };

    await this.prisma.subscriptionHistory.update({
      where: { id: history.id },
      data: { status: "SUCCESS" },
    });

    await this.prisma.infrastructure.update({
      where: { id: history.infrastructureId },
      data: {
        subscriptionPlan: history.plan,
        subscriptionStatus: "ACTIVE",
        subscriptionEndsAt: history.endDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.queue.enqueueBilling({
      infrastructureId: history.infrastructureId,
      plan: history.plan,
      amount: history.amount,
      provider: history.provider,
      transactionId,
    });

    return { success: true };
  }

  async handleWebhook(provider: PaymentProvider, payload: Record<string, unknown>, signature: string) {
    const secret = process.env.WEBHOOK_SECRET ?? "webhook-secret-change-me";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (signature !== expected) {
      return { error: "Signature invalide" };
    }

    const eventId = (payload.eventId as string) ?? crypto.randomUUID();
    await this.prisma.paymentEvent.create({
      data: { provider, eventId, payload: payload as object, processed: true },
    });

    return { received: true };
  }

  async getHistory(infraId: string) {
    return this.prisma.subscriptionHistory.findMany({
      where: { infrastructureId: infraId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
