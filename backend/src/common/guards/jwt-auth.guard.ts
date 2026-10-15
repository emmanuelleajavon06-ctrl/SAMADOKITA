import {
  ExecutionContext,
  Injectable,
  mixin,
  Optional,
  SetMetadata,
  Type,
} from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends PassportAuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const isPublic =
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler()) ||
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getClass());
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

export const AuthGuard: () => Type<unknown> = () => mixin(JwtAuthGuard);
