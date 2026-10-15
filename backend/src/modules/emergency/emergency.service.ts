import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateEmergencyDto, UpdateEmergencyDto } from "./dto/create-emergency.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";
import { QueueService } from "../../queues/queue.service";
import { EmergencyStatus } from "@prisma/client";

@Injectable()
export class EmergencyService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService
  ) {}

  async create(dto: CreateEmergencyDto, user: { id: string; infrastructureId: string }) {
    await checkSubscriptionLimits(this.prisma, user.infrastructureId);

    const emergency = await this.prisma.emergency.create({
      data: {
        userId: user.id,
        patientId: dto.patientId,
        lat: dto.lat,
        lng: dto.lng,
        status: dto.status ?? EmergencyStatus.ACTIVE,
        type: dto.type,
        description: dto.description,
        radiusKm: dto.radiusKm ?? 5,
        notifiedAt: new Date(),
      },
    });

    const nearbyUsers = await this.findNearbyUsers(dto.lat, dto.lng, dto.radiusKm ?? 5);
    for (const nearbyUser of nearbyUsers) {
      if (nearbyUser.id === user.id) continue;
      await this.queue.enqueueNotification({
        userId: nearbyUser.id,
        title: "Urgence à proximité",
        message: `Une urgence a été signalée dans un rayon de ${dto.radiusKm ?? 5}km.`,
        type: "EMERGENCY",
        data: { emergencyId: emergency.id, lat: dto.lat, lng: dto.lng },
      });
    }

    return emergency;
  }

  async findAll(status?: string) {
    return this.prisma.emergency.findMany({
      where: status ? { status: status as EmergencyStatus } : {},
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const emergency = await this.prisma.emergency.findUnique({
      where: { id },
      include: { patient: { select: { firstName: true, lastName: true, phone: true } } },
    });
    if (!emergency) throw new NotFoundException("Urgence introuvable");
    return emergency;
  }

  async update(id: string, dto: UpdateEmergencyDto) {
    const emergency = await this.prisma.emergency.findUnique({ where: { id } });
    if (!emergency) throw new NotFoundException("Urgence introuvable");
    return this.prisma.emergency.update({
      where: { id },
      data: {
        status: dto.status,
        description: dto.description,
        resolvedAt: dto.status === EmergencyStatus.RESOLVED ? new Date() : undefined,
      },
    });
  }

  async resolve(id: string) {
    const emergency = await this.prisma.emergency.findUnique({ where: { id } });
    if (!emergency) throw new NotFoundException("Urgence introuvable");
    return this.prisma.emergency.update({
      where: { id },
      data: { status: EmergencyStatus.RESOLVED, resolvedAt: new Date() },
    });
  }

  private async findNearbyUsers(lat: number, lng: number, radiusKm: number) {
    const earthRadius = 6371;
    const latRad = (lat * Math.PI) / 180;

    const users = await this.prisma.$queryRaw<Array<{ id: string; infrastructureId: string; role: string; lat: number | null; lng: number | null }>>`
      SELECT id, "infrastructureId", role, lat, lng
      FROM "User"
      WHERE "infrastructureId" IS NOT NULL
      AND lat IS NOT NULL AND lng IS NOT NULL
    `;

    return users.filter((u) => {
      if (u.lat == null || u.lng == null) return false;
      const dLat = ((u.lat - lat) * Math.PI) / 180;
      const dLng = ((u.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(latRad) * Math.cos((u.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadius * c <= radiusKm;
    });
  }
}
