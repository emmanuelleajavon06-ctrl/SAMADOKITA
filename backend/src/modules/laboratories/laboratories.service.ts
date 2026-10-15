import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateLabResultDto, UpdateLabResultDto } from "./dto/create-lab-result.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";
import { LabResultStatus } from "@prisma/client";

@Injectable()
export class LaboratoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLabResultDto, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    return this.prisma.labResult.create({
      data: {
        patientId: dto.patientId,
        laboratoryId: dto.laboratoryId,
        type: dto.type,
        result: dto.result,
        resultDate: dto.resultDate ? new Date(dto.resultDate) : null,
        notes: dto.notes,
        status: LabResultStatus.PENDING,
      },
    });
  }

  async findAll(user: { infrastructureId: string; role: string }, opts: { cursor?: string; take: number; patientId?: string }) {
    const take = Math.min(opts.take, 50);
    const where = {
      ...(user.role !== "SUPER_ADMIN" ? { patient: { infrastructureId: user.infrastructureId } } : {}),
      ...(opts.patientId ? { patientId: opts.patientId } : {}),
    };
    const items = await this.prisma.labResult.findMany({
      where,
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });
    const last = items[items.length - 1];
    return { items, nextCursor: items.length === take ? last.id : null };
  }

  async findOne(id: string, user: { infrastructureId: string; role: string }) {
    const labResult = await this.prisma.labResult.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!labResult) throw new NotFoundException("Résultat introuvable");
    if (user.role !== "SUPER_ADMIN" && labResult.patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Résultat introuvable");
    }
    return labResult;
  }

  async update(id: string, dto: UpdateLabResultDto) {
    const labResult = await this.prisma.labResult.findUnique({ where: { id } });
    if (!labResult) throw new NotFoundException("Résultat introuvable");
    return this.prisma.labResult.update({
      where: { id },
      data: {
        result: dto.result,
        status: dto.status as LabResultStatus,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    const labResult = await this.prisma.labResult.findUnique({ where: { id } });
    if (!labResult) throw new NotFoundException("Résultat introuvable");
    await this.prisma.labResult.delete({ where: { id } });
    return { deleted: true };
  }
}
