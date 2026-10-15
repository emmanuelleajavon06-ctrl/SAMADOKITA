import { Injectable, Logger } from "@nestjs/common";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { PrismaService } from "../prisma.service";
import { MinioService } from "../minio.service";
import PDFDocument from "pdfkit";

@Injectable()
export class BillingWorker {
  private logger = new Logger("BillingWorker");

  constructor(
    private prisma: PrismaService,
    private minio: MinioService
  ) {
    new Worker(
      "billing",
      async (job) => {
        const { infrastructureId, plan, amount, provider, transactionId } = job.data as {
          infrastructureId: string;
          plan: string;
          amount: number;
          provider: string;
          transactionId: string;
        };
        const history = await this.prisma.subscriptionHistory.create({
          data: {
            infrastructureId,
            plan: plan as never,
            amount,
            provider: provider as never,
            status: "SUCCESS",
            transactionId,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        const invoice = await this.prisma.invoice.create({
          data: {
            infrastructureId,
            subscriptionHistoryId: history.id,
            amount,
            issuedAt: new Date(),
          },
        });
        const buffers: Buffer[] = [];
        const doc = new PDFDocument();
        doc.on("data", (c) => buffers.push(c));
        doc.on("end", async () => {
          const buffer = Buffer.concat(buffers);
          const url = await this.minio.upload(
            `invoices/${invoice.id}.pdf`,
            buffer,
            "application/pdf"
          );
          await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl: url } });
        });
        doc.fontSize(20).text("FACTURE — SamaDokita", { align: "center" });
        doc.moveDown().fontSize(12);
        doc.text(`Transaction: ${transactionId}`);
        doc.text(`Plan: ${plan} — Montant: ${amount} FCFA — Provider: ${provider}`);
        doc.end();

        await this.prisma.infrastructure.update({
          where: { id: infrastructureId },
          data: { subscriptionStatus: "ACTIVE", subscriptionPlan: plan as never },
        });
        this.logger.log(`Facture générée pour infra ${infrastructureId}: ${amount} FCFA (${provider})`);
        return { ok: true };
      },
      { connection: new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null }) }
    );
  }
}
