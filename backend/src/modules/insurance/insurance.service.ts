import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateInsuranceDto, CreateInsurancePolicyDto } from "./dto/create-insurance.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class InsuranceService {
  constructor(private prisma: PrismaService) {}

  async createInsurance(dto: CreateInsuranceDto, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);
    return this.prisma.insurance.create({
      data: {
        name: dto.name,
        code: dto.code,
        coverageRate: dto.coverageRate ?? 80,
        infrastructureId: infraId,
      },
    });
  }

  async findInsurances(infraId?: string) {
    return this.prisma.insurance.findMany({
      where: infraId ? { infrastructureId: infraId } : {},
      take: 50,
      orderBy: { name: "asc" },
    });
  }

  async createPolicy(dto: CreateInsurancePolicyDto, user: { infrastructureId: string }) {
    await checkSubscriptionLimits(this.prisma, user.infrastructureId);
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");
    if (patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Patient introuvable");
    }
    return this.prisma.insurancePolicy.create({
      data: {
        patientId: dto.patientId,
        insuranceId: dto.insuranceId,
        policyNumber: dto.policyNumber,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        coverageRate: dto.coverageRate ?? 80,
      },
    });
  }

  async findPolicies(user: { infrastructureId: string; role: string }) {
    return this.prisma.insurancePolicy.findMany({
      where: user.role !== "SUPER_ADMIN" ? { patient: { infrastructureId: user.infrastructureId } } : {},
      include: {
        patient: { select: { firstName: true, lastName: true } },
        insurance: true,
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
  }

  async removePolicy(id: string) {
    const policy = await this.prisma.insurancePolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundException("Police introuvable");
    await this.prisma.insurancePolicy.delete({ where: { id } });
    return { deleted: true };
  }
}
