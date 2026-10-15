import {
  Body,
  Controller,
  Get,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import {
  Enable2faDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  Verify2faDto,
} from "./dto";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { SkipCache } from "../../common/decorators/cache.decorator";
import { SkipSubscription } from "../../common/decorators/skip-subscription.decorator";

@Controller("auth")
@SkipSubscription()
@Throttle({ global: { limit: 100, ttl: 60_000 }, short: { limit: 10, ttl: 1_000 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @AuditAction("AUTH_REGISTER")
  @SkipCache()
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @AuditAction("AUTH_LOGIN")
  @SkipCache()
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.socket?.remoteAddress ??
      "unknown";
    return this.authService.login(dto, ip, req.headers["user-agent"] ?? "unknown");
  }

  @Public()
  @Post("verify-2fa")
  @AuditAction("AUTH_2FA_VERIFY")
  @SkipCache()
  async verify2fa(@Body() dto: Verify2faDto) {
    return this.authService.verify2fa(dto);
  }

  @Post("enable-2fa")
  @AuditAction("AUTH_2FA_ENABLE")
  @SkipCache()
  async enable2fa(@Body() dto: Enable2faDto, @CurrentUser("id") userId: string) {
    return this.authService.enable2fa(userId, dto.code);
  }

  @Get("2fa-secret")
  async get2faSecret(@CurrentUser("id") userId: string) {
    return this.authService.get2faSecret(userId);
  }

  @Public()
  @Post("refresh")
  @AuditAction("AUTH_REFRESH")
  @SkipCache()
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post("logout")
  @AuditAction("AUTH_LOGOUT")
  @SkipCache()
  async logout(@Body() dto: Partial<RefreshDto>) {
    return this.authService.logout(dto.refreshToken ?? "");
  }

  @Public()
  @Post("forgot-password")
  @AuditAction("AUTH_FORGOT")
  @SkipCache()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  @AuditAction("AUTH_RESET")
  @SkipCache()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get("me")
  @SkipCache()
  async me(@CurrentUser() user: { password: string } & Record<string, unknown>) {
    const { password: _pw, ...safe } = user;
    return safe;
  }
}
