import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreatePregnancyDto, UpdatePregnancyDto } from "./dto/create-pregnancy.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class PregnancyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePregnancyDto, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const timeline = dto.timeline ?? {
      trimester: 1,
      steps: [
        { week: 1, note: "Début de grossesse" },
        { week: 12, note: "Fin du 1er trimestre" },
        { week: 24, note: "Échographie morphologique" },
      ],
    };

    return this.prisma.pregnancy.create({
      data: {
        patientId: dto.patientId,
        expectedDueDate: new Date(dto.expectedDueDate),
        lastMenstrualPeriod: dto.lastMenstrualPeriod ? new Date(dto.lastMenstrualPeriod) : null,
        timeline: timeline as never,
        riskLevel: dto.riskLevel ?? "LOW",
        notes: dto.notes,
      },
    });
  }

  async findOne(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");
    return this.prisma.pregnancy.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, dto: UpdatePregnancyDto) {
    const pregnancy = await this.prisma.pregnancy.findUnique({ where: { id } });
    if (!pregnancy) throw new NotFoundException("Grossesse introuvable");
    return this.prisma.pregnancy.update({
      where: { id },
      data: {
        expectedDueDate: dto.expectedDueDate ? new Date(dto.expectedDueDate) : undefined,
        riskLevel: dto.riskLevel,
        timeline: dto.timeline as never,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    const pregnancy = await this.prisma.pregnancy.findUnique({ where: { id } });
    if (!pregnancy) throw new NotFoundException("Grossesse introuvable");
    await this.prisma.pregnancy.delete({ where: { id } });
    return { deleted: true };
  }
}
