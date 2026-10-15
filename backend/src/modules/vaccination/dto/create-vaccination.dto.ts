import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreateVaccinationDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsString() @IsNotEmpty() vaccine!: string;
  @IsInt() @Min(1) doseNumber!: number;
  @IsDateString() vaccinationDate!: string;
  @IsOptional() @IsDateString() nextDoseDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateVaccinationDto {
  @IsOptional() @IsString() vaccine?: string;
  @IsOptional() @IsInt() doseNumber?: number;
  @IsOptional() @IsDateString() vaccinationDate?: string;
  @IsOptional() @IsDateString() nextDoseDate?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() notes?: string;
}
