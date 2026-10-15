import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { RedisService } from "./redis.service";
import { MinioService } from "./minio.service";
import { QueueService } from "./queues/queue.service";

@Global()
@Module({
  providers: [PrismaService, RedisService, MinioService, QueueService],
  exports: [PrismaService, RedisService, MinioService, QueueService],
})
export class CoreModule {}
