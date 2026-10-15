import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { RiskLevel } from "@prisma/client";

export class CreatePregnancyDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsDateString() expectedDueDate!: string;
  @IsOptional() @IsDateString() lastMenstrualPeriod?: string;
  @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @IsOptional() @IsObject() timeline?: Record<string, unknown>;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePregnancyDto {
  @IsOptional() @IsDateString() expectedDueDate?: string;
  @IsOptional() @IsEnum(RiskLevel) riskLevel?: RiskLevel;
  @IsOptional() @IsObject() timeline?: Record<string, unknown>;
  @IsOptional() @IsString() notes?: string;
}
