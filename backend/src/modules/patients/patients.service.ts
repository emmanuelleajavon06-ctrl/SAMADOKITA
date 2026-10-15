import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreatePatientDto, UpdatePatientDto } from "./dto/create-patient.dto";
import { assertCanAddPatient, checkSubscriptionLimits } from "../../common/utils/limits.util";
import { QueueService } from "../../queues/queue.service";
import { randomUUID } from "crypto";

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService
  ) {}

  async create(dto: CreatePatientDto, user: { id: string; infrastructureId: string }) {
    const infra = await checkSubscriptionLimits(this.prisma, user.infrastructureId);
    await assertCanAddPatient(this.prisma, infra.id, infra.maxPatients);

    const patient = await this.prisma.patient.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        gender: dto.gender ?? null,
        phone: dto.phone,
        address: dto.address,
        bloodGroup: dto.bloodGroup,
        allergies: dto.allergies ?? [],
        chronicDiseases: dto.chronicDiseases ?? [],
        medicalHistory: (dto.medicalHistory as object) ?? {},
        infrastructureId: infra.id,
        createdById: user.id,
      },
    });
    await this.queue.enqueueNotification({
      userId: user.id,
      title: "Nouveau patient",
      message: `${patient.firstName} ${patient.lastName} a été enregistré.`,
      type: "SYSTEM",
    });
    return patient;
  }

  async findAll(
    user: { infrastructureId: string; role: string },
    opts: { cursor?: string; take: number; q?: string }
  ) {
    const take = Math.min(opts.take, 50);
    const where = {
      ...(user.role !== "SUPER_ADMIN" ? { infrastructureId: user.infrastructureId } : {}),
      ...(opts.q
        ? {
            OR: [
              { firstName: { contains: opts.q, mode: "insensitive" as const } },
              { lastName: { contains: opts.q, mode: "insensitive" as const } },
              { phone: { contains: opts.q } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        take,
        ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
        orderBy: { createdAt: "desc" },
        include: { insurancePolicy: { include: { insurance: true } } },
      }),
      this.prisma.patient.count({ where }),
    ]);

    const last = items[items.length - 1];
    return {
      items,
      nextCursor: items.length === take ? last.id : null,
      total,
    };
  }

  async findOne(id: string, user: { infrastructureId: string; role: string }) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: { take: 5, orderBy: { scheduledAt: "desc" } },
        prescriptions: { take: 5, orderBy: { issuedAt: "desc" } },
        vaccinations: { orderBy: { vaccinationDate: "desc" } },
        labResults: { take: 5, orderBy: { createdAt: "desc" } },
        pregnancies: true,
        insurancePolicy: { include: { insurance: true } },
      },
    });
    if (!patient) throw new NotFoundException("Patient introuvable");
    if (user.role !== "SUPER_ADMIN" && patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Patient introuvable");
    }
    return patient;
  }

  async update(
    id: string,
    dto: UpdatePatientDto,
    user: { infrastructureId: string; role: string }
  ) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException("Patient introuvable");
    if (user.role !== "SUPER_ADMIN" && patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Patient introuvable");
    }
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
        ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.allergies !== undefined ? { allergies: dto.allergies } : {}),
        ...(dto.chronicDiseases !== undefined ? { chronicDiseases: dto.chronicDiseases } : {}),
        ...(dto.medicalHistory !== undefined ? { medicalHistory: dto.medicalHistory as object } : {}),
      },
    });
  }

  async remove(id: string, user: { infrastructureId: string; role: string }) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException("Patient introuvable");
    if (user.role !== "SUPER_ADMIN" && patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Patient introuvable");
    }
    await this.prisma.patient.delete({ where: { id } });
    return { deleted: true };
  }

  async search(user: { infrastructureId: string; role: string }, q: string) {
    return this.prisma.patient.findMany({
      where: {
        ...(user.role !== "SUPER_ADMIN" ? { infrastructureId: user.infrastructureId } : {}),
        OR: [
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
  }
}
