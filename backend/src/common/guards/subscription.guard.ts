import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";
import { SKIP_SUBSCRIPTION_KEY } from "../decorators/skip-subscription.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Les routes @Public() (health, webhook…) contournent toute vérification d'abonnement.
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (isPublic) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_SUBSCRIPTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("Non authentifié");

    // SUPER_ADMIN et ADMIN_INFRA gardent l'accès même si l'infra est suspendue
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN_INFRA) return true;

    const infra = user.infrastructureId
      ? await request.app.get("PrismaService").infrastructure.findUnique({
          where: { id: user.infrastructureId },
          select: { subscriptionStatus: true },
        })
      : null;

    if (infra && infra.subscriptionStatus === "SUSPENDED") {
      throw new ForbiddenException(
        "Abonnement suspendu. Veuillez renouveler votre abonnement pour continuer."
      );
    }
    return true;
  }
}
