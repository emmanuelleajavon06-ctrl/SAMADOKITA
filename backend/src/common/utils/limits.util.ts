import { ForbiddenException } from "@nestjs/common";
import { SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma.service";

export async function checkSubscriptionLimits(
  prisma: PrismaService,
  infrastructureId: string
) {
  const infra = await prisma.infrastructure.findUnique({
    where: { id: infrastructureId },
  });
  if (!infra) throw new ForbiddenException("Infrastructure introuvable");

  if (
    infra.subscriptionStatus === SubscriptionStatus.SUSPENDED ||
    infra.subscriptionStatus === SubscriptionStatus.CANCELED
  ) {
    throw new ForbiddenException(
      `Abonnement ${infra.subscriptionStatus}. Veuillez renouveler.`
    );
  }
  return infra;
}

export async function assertCanAddPatient(
  prisma: PrismaService,
  infraId: string,
  maxPatients: number
) {
  const count = await prisma.patient.count({ where: { infrastructureId: infraId } });
  if (count >= maxPatients) {
    throw new ForbiddenException(
      `Limite patients atteinte (${maxPatients}). Passez à un plan supérieur.`
    );
  }
}

export async function assertCanAddUser(
  prisma: PrismaService,
  infraId: string,
  maxUsers: number
) {
  const count = await prisma.user.count({ where: { infrastructureId: infraId } });
  if (count >= maxUsers) {
    throw new ForbiddenException(
      `Limite utilisateurs atteinte (${maxUsers}). Passez à un plan supérieur.`
    );
  }
}
