import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateDoctorDto, UpdateDoctorDto } from "./dto/create-doctor.dto";
import { assertCanAddUser, checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDoctorDto, infraId: string) {
    const infra = await checkSubscriptionLimits(this.prisma, infraId);
    await assertCanAddUser(this.prisma, infra.id, infra.maxUsers);

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    return this.prisma.doctor.create({
      data: {
        userId: dto.userId,
        specialty: dto.specialty,
        licenseNumber: dto.licenseNumber,
        availability: dto.availability ? JSON.parse(dto.availability) : null,
        bio: dto.bio,
        infrastructureId: infra.id,
      },
    });
  }

  async findAll(infraId: string, q?: string) {
    return this.prisma.doctor.findMany({
      where: {
        infrastructureId: infraId,
        ...(q
          ? {
              OR: [
                { specialty: { contains: q, mode: "insensitive" as const } },
                { user: { firstName: { contains: q, mode: "insensitive" as const } } },
                { user: { lastName: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (!doctor) throw new NotFoundException("Médecin introuvable");
    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");
    return this.prisma.doctor.update({
      where: { id },
      data: {
        specialty: dto.specialty,
        licenseNumber: dto.licenseNumber,
        availability: dto.availability ? JSON.parse(dto.availability) : undefined,
        bio: dto.bio,
      },
    });
  }

  async remove(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");
    await this.prisma.doctor.delete({ where: { id } });
    return { deleted: true };
  }
}
