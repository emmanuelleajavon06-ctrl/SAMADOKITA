import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateVaccinationDto, UpdateVaccinationDto } from "./dto/create-vaccination.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class VaccinationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVaccinationDto, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);
    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    return this.prisma.vaccination.create({
      data: {
        patientId: dto.patientId,
        vaccine: dto.vaccine,
        doseNumber: dto.doseNumber,
        vaccinationDate: new Date(dto.vaccinationDate),
        nextDoseDate: dto.nextDoseDate ? new Date(dto.nextDoseDate) : null,
        location: dto.location,
        notes: dto.notes,
      },
    });
  }

  async findCarnet(patientId: string) {
    const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");
    const vaccinations = await this.prisma.vaccination.findMany({
      where: { patientId },
      orderBy: { vaccinationDate: "desc" },
    });
    const upcoming = vaccinations.filter((v) => v.nextDoseDate && v.nextDoseDate > new Date());
    return { patient: { firstName: patient.firstName, lastName: patient.lastName }, vaccinations, upcoming };
  }

  async findAll(user: { infrastructureId: string; role: string }, patientId?: string) {
    return this.prisma.vaccination.findMany({
      where: {
        ...(user.role !== "SUPER_ADMIN" ? { patient: { infrastructureId: user.infrastructureId } } : {}),
        ...(patientId ? { patientId } : {}),
      },
      include: { patient: { select: { firstName: true, lastName: true } } },
      take: 50,
      orderBy: { vaccinationDate: "desc" },
    });
  }

  async update(id: string, dto: UpdateVaccinationDto) {
    const vaccination = await this.prisma.vaccination.findUnique({ where: { id } });
    if (!vaccination) throw new NotFoundException("Vaccination introuvable");
    return this.prisma.vaccination.update({
      where: { id },
      data: {
        vaccine: dto.vaccine,
        doseNumber: dto.doseNumber,
        vaccinationDate: dto.vaccinationDate ? new Date(dto.vaccinationDate) : undefined,
        nextDoseDate: dto.nextDoseDate ? new Date(dto.nextDoseDate) : undefined,
        location: dto.location,
        notes: dto.notes,
      },
    });
  }

  async remove(id: string) {
    const vaccination = await this.prisma.vaccination.findUnique({ where: { id } });
    if (!vaccination) throw new NotFoundException("Vaccination introuvable");
    await this.prisma.vaccination.delete({ where: { id } });
    return { deleted: true };
  }
}
