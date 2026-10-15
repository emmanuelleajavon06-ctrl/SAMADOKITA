import { IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLabResultDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsOptional() @IsString() laboratoryId?: string;
  @IsString() @IsNotEmpty() type!: string;
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsISO8601() resultDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateLabResultDto {
  @IsOptional() @IsString() result?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
}
