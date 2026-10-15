import { Injectable, Logger } from "@nestjs/common";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { PrismaService } from "../prisma.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class NotificationWorker {
  private logger = new Logger("NotificationWorker");

  constructor(
    private prisma: PrismaService,
    private mail: MailService
  ) {
    new Worker(
      "notifications",
      async (job) => {
        const { userId, title, message, type } = job.data as {
          userId: string;
          title: string;
          message: string;
          type: string;
        };
        await this.prisma.notification.create({
          data: { userId, title, message, type: type as never },
        });
        this.logger.log(`Notification envoyée à ${userId}: ${title}`);

        // Relais email (best-effort, non bloquant) si le user a une adresse
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, firstName: true },
        });
        if (user?.email) {
          await this.mail.send(user.email, "generic", {
            title,
            message,
            firstName: user.firstName,
          });
        }
        return { ok: true };
      },
      { connection: new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null }) }
    );
  }
}
