import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { userId: string; title: string; message: string; type: string; data?: unknown }) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type as never,
        data: (dto.data as object) ?? null,
      },
    });
  }

  async findAll(user: { id: string }, opts: { cursor?: string; take: number; unreadOnly?: boolean }) {
    const take = Math.min(opts.take, 50);
    const where = {
      userId: user.id,
      ...(opts.unreadOnly ? { read: false } : {}),
    };
    const items = await this.prisma.notification.findMany({
      where,
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { createdAt: "desc" },
    });
    const last = items[items.length - 1];
    const unreadCount = await this.prisma.notification.count({ where: { userId: user.id, read: false } });
    return { items, nextCursor: items.length === take ? last.id : null, unreadCount };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) throw new NotFoundException("Notification introuvable");
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) throw new NotFoundException("Notification introuvable");
    await this.prisma.notification.delete({ where: { id } });
    return { deleted: true };
  }
}
