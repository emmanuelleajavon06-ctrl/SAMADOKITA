import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { SubscriptionStatus } from "@prisma/client";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(infraId: string, userRole: string) {
    const infra = await this.prisma.infrastructure.findUnique({ where: { id: infraId } });
    if (!infra) return null;

    const [
      totalPatients,
      totalDoctors,
      totalUsers,
      patientsToday,
      patientsThisWeek,
      appointmentsToday,
      activeEmergencies,
      pendingPrescriptions,
      revenueThisMonth,
      monthlyRevenue,
      patientsByMonth,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { infrastructureId: infraId } }),
      this.prisma.doctor.count({ where: { infrastructureId: infraId } }),
      this.prisma.user.count({ where: { infrastructureId: infraId } }),
      this.prisma.patient.count({
        where: { infrastructureId: infraId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.patient.count({
        where: { infrastructureId: infraId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.appointment.count({
        where: { patient: { infrastructureId: infraId }, scheduledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.emergency.count({ where: { status: SubscriptionStatus ? "ACTIVE" : "ACTIVE" } }),
      this.prisma.prescription.count({ where: { patient: { infrastructureId: infraId }, status: "VALIDATED" } }),
      this.prisma.subscriptionHistory.aggregate({
        _sum: { amount: true },
        where: { infrastructureId: infraId, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      this.prisma.subscriptionHistory.groupBy({
        by: ["provider"],
        _sum: { amount: true },
        where: { infrastructureId: infraId },
      }),
      this.prisma.patient.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: { infrastructureId: infraId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      infra: {
        name: infra.name,
        plan: infra.subscriptionPlan,
        status: infra.subscriptionStatus,
        trialEndsAt: infra.trialEndsAt,
        subscriptionEndsAt: infra.subscriptionEndsAt,
        maxUsers: infra.maxUsers,
        maxPatients: infra.maxPatients,
      },
      stats: {
        totalPatients,
        totalDoctors,
        totalUsers,
        patientsToday,
        patientsThisWeek,
        appointmentsToday,
        activeEmergencies,
        pendingPrescriptions,
        revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      },
      charts: {
        monthlyRevenue,
        patientsByMonth,
      },
    };
  }

  async getRoleStats(user: { role: string; infrastructureId: string }) {
    if (user.role === "SUPER_ADMIN") {
      const [totalInfrastructures, totalPatients, totalUsers, totalDoctors] = await Promise.all([
        this.prisma.infrastructure.count(),
        this.prisma.patient.count(),
        this.prisma.user.count(),
        this.prisma.doctor.count(),
      ]);
      return { totalInfrastructures, totalPatients, totalUsers, totalDoctors };
    }
    return this.getStats(user.infrastructureId, user.role);
  }
}
