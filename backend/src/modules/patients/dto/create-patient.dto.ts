import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Gender } from "@prisma/client";

export class CreatePatientDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsOptional() @IsISO8601() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() allergies?: string[];
  @IsOptional() chronicDiseases?: string[];
  @IsOptional() medicalHistory?: Record<string, unknown>;
}

export class UpdatePatientDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsISO8601() dateOfBirth?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() bloodGroup?: string;
  @IsOptional() allergies?: string[];
  @IsOptional() chronicDiseases?: string[];
  @IsOptional() medicalHistory?: Record<string, unknown>;
}
