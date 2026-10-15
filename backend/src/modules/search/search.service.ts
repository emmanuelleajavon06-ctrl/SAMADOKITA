import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async global(user: { infrastructureId: string; role: string }, query: string) {
    const scope = user.role !== "SUPER_ADMIN" ? { infrastructureId: user.infrastructureId } : {};

    const [patients, doctors, appointments] = await Promise.all([
      this.prisma.patient.findMany({
        where: {
          ...scope,
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { phone: { contains: query } },
          ],
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, phone: true },
      }),
      this.prisma.doctor.findMany({
        where: {
          ...scope,
          OR: [
            { specialty: { contains: query, mode: "insensitive" as const } },
            { user: { firstName: { contains: query, mode: "insensitive" as const } } },
            { user: { lastName: { contains: query, mode: "insensitive" as const } } },
          ],
        },
        take: 10,
        select: { id: true, specialty: true, user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { patient: scope as never, reason: { contains: query, mode: "insensitive" as const } },
        take: 10,
        select: { id: true, reason: true, scheduledAt: true, status: true },
      }),
    ]);

    return { patients, doctors, appointments, query };
  }
}
