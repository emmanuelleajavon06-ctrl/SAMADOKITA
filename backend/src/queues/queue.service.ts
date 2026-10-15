import { Injectable, OnModuleInit } from "@nestjs/common";
import { Queue } from "bullmq";
import { Redis } from "ioredis";

@Injectable()
export class QueueService implements OnModuleInit {
  private connection: Redis;
  notifications!: Queue;
  pdf!: Queue;
  billing!: Queue;

  constructor() {
    this.connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
    this.notifications = new Queue("notifications", { connection: this.connection });
    this.pdf = new Queue("pdf", { connection: this.connection });
    this.billing = new Queue("billing", { connection: this.connection });
  }

  async onModuleInit() {
    if (this.connection.status === "wait") await this.connection.connect();
  }

  async enqueueNotification(job: { userId: string; title: string; message: string; type: string; data?: Record<string, unknown> }) {
    return this.notifications.add("send", job, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
  }

  async enqueuePdf(job: { type: string; entityId: string; data: unknown }) {
    return this.pdf.add("generate", job, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
  }

  async enqueueBilling(job: { infrastructureId: string; plan: string; amount: number; provider: string; transactionId: string }) {
    return this.billing.add("invoice", job, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
  }
}
