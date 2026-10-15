import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { TeleconsultationStatus } from "@prisma/client";
import { checkSubscriptionLimits } from "../../common/utils/limits.util";

@Injectable()
export class TeleconsultationService {
  constructor(private prisma: PrismaService) {}

  async start(appointmentId: string, doctorId: string) {
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException("Rendez-vous introuvable");
    if (appt.doctorId !== doctorId) throw new NotFoundException("Non autorisé");
    await checkSubscriptionLimits(this.prisma, appt.doctorId ? await this.resolveInfra(doctorId) : appt.doctorId);

    return this.prisma.teleconsultation.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        doctorId,
        patientId: appt.patientId,
        meetingLink: appt.meetingLink ?? `https://meet.jit.si/SamaDokita-${appointmentId}`,
        status: TeleconsultationStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      update: { status: TeleconsultationStatus.IN_PROGRESS, startedAt: new Date() },
    });
  }

  async end(appointmentId: string) {
    const tc = await this.prisma.teleconsultation.findUnique({ where: { appointmentId } });
    if (!tc) throw new NotFoundException("Téléconsultation introuvable");
    return this.prisma.teleconsultation.update({
      where: { appointmentId },
      data: { status: TeleconsultationStatus.ENDED, endedAt: new Date() },
    });
  }

  async pushChat(appointmentId: string, message: { senderId: string; content: string; sentAt: string }) {
    const tc = await this.prisma.teleconsultation.findUnique({ where: { appointmentId } });
    if (!tc) throw new NotFoundException("Téléconsultation introuvable");
    const messages = (tc.chatMessages as unknown as Array<{ senderId: string; content: string; sentAt: string }>) ?? [];
    messages.push(message);
    return this.prisma.teleconsultation.update({
      where: { appointmentId },
      data: { chatMessages: messages as never },
    });
  }

  async findOne(appointmentId: string) {
    const tc = await this.prisma.teleconsultation.findUnique({
      where: { appointmentId },
      include: {
        appointment: { include: { patient: true, doctor: { include: { user: true } } } },
      },
    });
    if (!tc) throw new NotFoundException("Téléconsultation introuvable");
    return tc;
  }

  private async resolveInfra(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException("Médecin introuvable");
    return doctor.infrastructureId;
  }
}
