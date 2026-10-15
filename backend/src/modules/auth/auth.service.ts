import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RedisService } from "../../redis.service";
import { PrismaService } from "../../prisma.service";
import { QueueService } from "../../queues/queue.service";
import { TotpService } from "../../services/totp.service";
import { MailService } from "../../mail/mail.service";
import { LoginDto, RegisterDto, ResetPasswordDto, Verify2faDto } from "./dto";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { Role } from "@prisma/client";

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private queue: QueueService,
    private totp: TotpService,
    private mail: MailService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException("Email déjà utilisé");

    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const now = new Date();

    const infrastructure = await this.prisma.infrastructure.create({
      data: {
        name: dto.infraName,
        type: dto.infraType ?? "HOPITAL",
        address: dto.address,
        subscriptionPlan: "STARTER",
        subscriptionStatus: "TRIALING",
        trialEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        maxUsers: 5,
        maxPatients: 500,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: Role.ADMIN_INFRA,
        infrastructureId: infrastructure.id,
      },
    });

    await this.queue.enqueueNotification({
      userId: user.id,
      title: "Bienvenue sur SamaDokita",
      message: "Votre essai gratuit de 30 jours est activé.",
      type: "SYSTEM",
    });

    void this.mail.send(user.email, "welcome", {
      firstName: user.firstName,
      infraName: infrastructure.name,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    await this.prisma.loginAttempt.create({
      data: { email: dto.email, ip, userAgent, success: false },
    });

    if (!user) throw new UnauthorizedException("Identifiants invalides");
    if (user.status === "LOCKED") throw new UnauthorizedException("Compte verrouillé");

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException("Compte verrouillé");
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          lockedUntil: attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        },
      });
      throw new UnauthorizedException("Identifiants invalides");
    }

    if (user.twoFactorEnabled && !dto.totpCode) {
      const tempToken = this.jwt.sign(
        { sub: user.id, step: "2fa" },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "5m" }
      );
      return { requires2FA: true, tempToken };
    }

    if (user.twoFactorEnabled && dto.totpCode) {
      if (!this.totp.verify(user.twoFactorSecret ?? "", dto.totpCode)) {
        throw new UnauthorizedException("Code 2FA invalide");
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return this.issueTokens(user);
  }

  async verify2fa(dto: Verify2faDto) {
    let payload: { sub: string; step: string };
    try {
      payload = this.jwt.verify(dto.tempToken, { secret: process.env.JWT_ACCESS_SECRET }) as never;
    } catch {
      throw new UnauthorizedException("Token expiré");
    }
    if (payload.step !== "2fa") throw new UnauthorizedException("Token invalide");

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.twoFactorEnabled) throw new UnauthorizedException("2FA non activé");
    if (!this.totp.verify(user.twoFactorSecret ?? "", dto.code)) {
      throw new UnauthorizedException("Code 2FA invalide");
    }
    return this.issueTokens(user);
  }

  async get2faSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("Utilisateur introuvable");
    const secret = this.totp.generateSecret();
    return { secret, otpauthUrl: this.totp.getOtpauthUrl(user.email, secret) };
  }

  async get2faSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("Utilisateur introuvable");
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return {
        enabled: true,
        secret: user.twoFactorSecret,
        otpauthUrl: this.totp.getOtpauthUrl(user.email, user.twoFactorSecret),
      };
    }
    return this.get2faSetup(userId);
  }

  async enable2fa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException("Utilisateur introuvable");
    const secret = user.twoFactorSecret ?? this.totp.generateSecret();
    if (!this.totp.verify(secret, code)) throw new BadRequestException("Code invalide");
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true, twoFactorSecret: secret },
    });
    void this.mail.send(user.email, "twoFactorEnabled", { firstName: user.firstName });
    return updated;
  }

  async refresh(refreshToken: string) {
    const stored = await this.redis.get(`refresh:${refreshToken}`);
    if (!stored) throw new UnauthorizedException("Token invalide");

    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET }) as never;
    } catch {
      await this.redis.del(`refresh:${refreshToken}`);
      throw new UnauthorizedException("Token expiré");
    }

    await this.redis.del(`refresh:${refreshToken}`);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException("Utilisateur introuvable");
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    if (refreshToken) await this.redis.del(`refresh:${refreshToken}`);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = randomUUID();
    await this.redis.set(`reset:${token}`, user.id, 15 * 60);
    const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    await this.mail.send(user.email, "resetPassword", {
      firstName: user.firstName,
      resetUrl,
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redis.get(`reset:${dto.token}`);
    if (!userId) throw new BadRequestException("Lien invalide ou expiré");
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, SALT_ROUNDS), failedAttempts: 0, lockedUntil: null },
    });
    await this.redis.del(`reset:${dto.token}`);
    return { success: true };
  }

  private async issueTokens(user: { id: string; email: string; role: Role; infrastructureId: string | null }) {
    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: "15m" }
    );
    const refreshToken = this.jwt.sign(
      { sub: user.id, jti: randomUUID() },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: "7d" }
    );
    await this.redis.set(`refresh:${refreshToken}`, user.id, 7 * 24 * 60 * 60);
    return { accessToken, refreshToken };
  }
}
