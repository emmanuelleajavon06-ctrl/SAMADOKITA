import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { CreateAppointmentDto, UpdateAppointmentDto } from "./dto/create-appointment.dto";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";
import { randomUUID } from "crypto";
import { AppointmentStatus } from "@prisma/client";

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto, user: { infrastructureId: string }) {
    await checkSubscriptionLimits(this.prisma, user.infrastructureId);

    const meetingLink = dto.isTeleconsultation
      ? `https://meet.jit.si/SamaDokita-${randomUUID().replace(/-/g, "").slice(0, 20)}`
      : null;

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes ?? 30,
        isTeleconsultation: dto.isTeleconsultation ?? false,
        meetingLink,
        reason: dto.reason,
        status: AppointmentStatus.PENDING,
      },
    });
  }

  async findAll(user: { infrastructureId: string; role: string }, opts: { cursor?: string; take: number; status?: string; patientId?: string; doctorId?: string }) {
    const take = Math.min(opts.take, 50);
    const where = {
      ...(user.role !== "SUPER_ADMIN" ? { patient: { infrastructureId: user.infrastructureId } } : {}),
      ...(opts.status ? { status: opts.status as AppointmentStatus } : {}),
      ...(opts.patientId ? { patientId: opts.patientId } : {}),
      ...(opts.doctorId ? { doctorId: opts.doctorId } : {}),
    };

    const items = await this.prisma.appointment.findMany({
      where,
      take,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { scheduledAt: "desc" },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        teleconsultation: true,
      },
    });

    const last = items[items.length - 1];
    return { items, nextCursor: items.length === take ? last.id : null };
  }

  async findOne(id: string, user: { infrastructureId: string; role: string }) {
    const appt = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        teleconsultation: true,
      },
    });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    if (user.role !== "SUPER_ADMIN" && appt.patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Rendez-vous introuvable");
    }
    return appt;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    return this.prisma.appointment.update({
      where: { id },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        reason: dto.reason,
        notes: dto.notes,
      },
    });
  }

  async cancel(id: string, user: { infrastructureId: string; role: string }) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { patient: true } });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    if (user.role !== "SUPER_ADMIN" && appt.patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Rendez-vous introuvable");
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  async confirm(id: string, user: { infrastructureId: string; role: string }) {
    const appt = await this.prisma.appointment.findUnique({ where: { id }, include: { patient: true } });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    if (user.role !== "SUPER_ADMIN" && appt.patient.infrastructureId !== user.infrastructureId) {
      throw new NotFoundException("Rendez-vous introuvable");
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CONFIRMED },
    });
  }

  async remove(id: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    await this.prisma.appointment.delete({ where: { id } });
    return { deleted: true };
  }
}
