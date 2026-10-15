import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreatePharmacyDto } from "./dto/create-pharmacy.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class PharmaciesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePharmacyDto, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);
    return this.prisma.pharmacy.create({ data: { ...dto, infrastructureId: infraId } });
  }

  async findAll(infraId?: string, near?: { lat: number; lng: number; radiusKm: number }) {
    if (near) {
      return this.prisma.pharmacy.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        take: 50,
      });
    }
    return this.prisma.pharmacy.findMany({
      where: infraId ? { infrastructureId: infraId } : {},
      take: 50,
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundException("Pharmacie introuvable");
    return pharmacy;
  }

  async remove(id: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundException("Pharmacie introuvable");
    await this.prisma.pharmacy.delete({ where: { id } });
    return { deleted: true };
  }
}
