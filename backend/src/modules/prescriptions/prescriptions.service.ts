import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreatePrescriptionDto, UpdatePrescriptionDto } from "./dto/create-prescription.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";
import { QueueService } from "../../queues/queue.service";
import { MinioService } from "../../minio.service";
import { PrescriptionStatus } from "@prisma/client";
import * as QRCode from "qrcode";

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private queue: QueueService,
    private minio: MinioService
  ) {}

  async create(dto: CreatePrescriptionDto, doctorId: string, infraId: string) {
    await checkSubscriptionLimits(this.prisma, infraId);

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!doctor) throw new NotFoundException("Médecin introuvable");

    const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException("Patient introuvable");

    const qrPayload = JSON.stringify({
      patient: `${patient.firstName} ${patient.lastName}`,
      doctor: doctorId,
      meds: dto.medications.map((m) => m.name),
      issuedAt: new Date().toISOString(),
    });
    const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 256, margin: 2 });

    const prescription = await this.prisma.prescription.create({
      data: {
        patientId: dto.patientId,
        doctorId: doctor.id,
        appointmentId: dto.appointmentId,
        medications: dto.medications as never,
        instructions: dto.instructions,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        qrCode: qrDataUrl,
        signature: `Dr. ${doctor.user?.firstName ?? ""} — Licence ${doctor.licenseNumber}`,
        status: PrescriptionStatus.VALIDATED,
      },
    });

    await this.queue.enqueuePdf({
      type: "prescription",
      entityId: prescription.id,
      data: {
        patient: `${patient.firstName} ${patient.lastName}`,
        doctorId: doctor.id,
        medications: dto.medications,
        instructions: dto.instructions,
        qrCode: qrDataUrl,
      },
    });

    return prescription;
  }

  async findAll(user: { infrastructureId: string; role: string }, opts: { cursor?: string; take: number; patientId?: string }) {
    const take = Math.min(opts.take, 50);
    const where = {
      ...(user.role !== "SUPER_ADMIN" ? { patient: { infrastructureId: user.infrastructureId } } : {}),
      ...(opts.patientId ? { patientId: opts.patientId } : {}),
    };
    const items = await this.prisma.prescription.findMany({
      where,
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { issuedAt: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    const last = items[items.length - 1];
    return { items, nextCursor: items.length === take ? last.id : null };
  }

  async findOne(id: string, user: { infrastructureId: string; role: string }) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: { patient: true, doctor: { include: { user: true } } },
    });
    if (!prescription) throw new NotFoundException("Ordonnance introuvable");
    if (user.role !== "SUPER_ADMIN" && prescription.patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Ordonnance introuvable");
    }
    return prescription;
  }

  async scan(qrCode: string) {
    return this.prisma.prescription.findFirst({
      where: { qrCode: { contains: qrCode.slice(-8) } },
      include: { patient: { select: { firstName: true, lastName: true, bloodGroup: true, allergies: true } } },
    });
  }

  async update(id: string, dto: UpdatePrescriptionDto) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException("Ordonnance introuvable");
    return this.prisma.prescription.update({
      where: { id },
      data: {
        instructions: dto.instructions,
        medications: dto.medications as never,
        status: dto.status as PrescriptionStatus,
      },
    });
  }

  async remove(id: string) {
    const prescription = await this.prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundException("Ordonnance introuvable");
    await this.prisma.prescription.delete({ where: { id } });
    return { deleted: true };
  }
}
