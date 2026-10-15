import { Injectable, Logger } from "@nestjs/common";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import PDFDocument from "pdfkit";
import { PrismaService } from "../prisma.service";
import { MinioService } from "../minio.service";

@Injectable()
export class PdfWorker {
  private logger = new Logger("PdfWorker");

  constructor(
    private prisma: PrismaService,
    private minio: MinioService
  ) {
    new Worker(
      "pdf",
      async (job) => {
        const { type, entityId, data } = job.data as {
          type: string;
          entityId: string;
          data: Record<string, unknown>;
        };
        const buffers: Buffer[] = [];
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        doc.on("data", (c) => buffers.push(c));
        doc.on("end", async () => {
          const buffer = Buffer.concat(buffers);
          const objectName = `pdfs/${type}/${entityId}.pdf`;
          const url = await this.minio.upload(objectName, buffer, "application/pdf");
          if (type === "prescription") {
            await this.prisma.prescription.update({ where: { id: entityId }, data: { pdfUrl: url } });
          } else if (type === "invoice") {
            await this.prisma.invoice.update({ where: { id: entityId }, data: { pdfUrl: url } });
          }
        });
        doc.fontSize(22).text("SamaDokita — Document Officiel", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Type: ${type}`, 50, 120);
        doc.text(`Référence: ${entityId}`, 50, 140);
        doc.moveDown();
        doc.text(JSON.stringify(data, null, 2), 50, 200, { width: 450 });
        doc.end();
        this.logger.log(`PDF généré: ${type}/${entityId}`);
        return { ok: true };
      },
      { connection: new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null }) }
    );
  }
}
