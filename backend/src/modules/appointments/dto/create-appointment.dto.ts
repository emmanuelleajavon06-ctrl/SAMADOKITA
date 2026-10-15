import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export class CreateAppointmentDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsString() @IsNotEmpty() doctorId!: string;
  @IsISO8601() scheduledAt!: string;
  @IsOptional() durationMinutes?: number;
  @IsOptional() @IsBoolean() isTeleconsultation?: boolean;
  @IsOptional() @IsString() reason?: string;
}

export class UpdateAppointmentDto {
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() notes?: string;
}
