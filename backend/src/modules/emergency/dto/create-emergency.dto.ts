import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { EmergencyStatus } from "@prisma/client";

export class CreateEmergencyDto {
  @IsOptional() @IsString() patientId?: string;
  @IsNumber() lat!: number;
  @IsNumber() lng!: number;
  @IsOptional() @IsEnum(EmergencyStatus) status?: EmergencyStatus;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() radiusKm?: number;
}

export class UpdateEmergencyDto {
  @IsOptional() @IsEnum(EmergencyStatus) status?: EmergencyStatus;
  @IsOptional() @IsString() description?: string;
}
