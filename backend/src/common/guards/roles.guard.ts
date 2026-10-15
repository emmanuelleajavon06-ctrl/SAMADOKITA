import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Role } from "@prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("Non authentifié");

    // SUPER_ADMIN outrepasse tout
    if (user.role === Role.SUPER_ADMIN) return true;
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Rôle ${user.role} non autorisé — attendu: ${required.join(", ")}`);
    }
    return true;
  }
}
