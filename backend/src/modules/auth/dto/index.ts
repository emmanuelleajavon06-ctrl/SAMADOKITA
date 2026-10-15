import { IsNotEmpty, IsString } from "class-validator";

export * from "./login.dto";
export * from "./register.dto";

export class RefreshDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string;
}

export class Verify2faDto {
  @IsNotEmpty()
  @IsString()
  code!: string;

  @IsNotEmpty()
  @IsString()
  tempToken!: string;
}

export class Enable2faDto {
  @IsNotEmpty()
  @IsString()
  code!: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  email!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsNotEmpty()
  @IsString()
  newPassword!: string;
}
