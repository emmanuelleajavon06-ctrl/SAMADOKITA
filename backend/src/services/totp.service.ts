import { Injectable } from "@nestjs/common";
import { authenticator } from "otplib";
import { HashAlgorithms } from "@otplib/core";

authenticator.options = {
  crypto: "crypto",
  digits: 6,
  period: 30,
  algorithm: HashAlgorithms.SHA1,
};

@Injectable()
export class TotpService {
  generateSecret(): string {
    return authenticator.generateSecret();
  }

  verify(secret: string, code: string): boolean {
    try {
      return authenticator.check(code, secret);
    } catch {
      return false;
    }
  }

  getOtpauthUrl(email: string, secret: string): string {
    return authenticator.keyuri(email, "SamaDokita", secret);
  }
}
