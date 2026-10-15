import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";
import { TotpService } from "../../services/totp.service";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_ACCESS_SECRET") ?? "access-secret-change-me",
        signOptions: { expiresIn: config.get<string>("JWT_ACCESS_TTL") ?? "15m" },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, TotpService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
