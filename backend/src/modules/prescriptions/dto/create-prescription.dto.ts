import {
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
} from "class-validator";

export class MedicationDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() dosage!: string;
  @IsString() frequency!: string;
  @IsString() duration!: string;
  @IsOptional() @IsString() notes?: string;
}

export class CreatePrescriptionDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsString() @IsNotEmpty() doctorId!: string;
  @IsOptional() @IsString() appointmentId?: string;
  @IsArray() @ArrayMinSize(1) medications!: MedicationDto[];
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsISO8601() expiresAt?: string;
}

export class UpdatePrescriptionDto {
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsArray() medications?: MedicationDto[];
  @IsOptional() @IsString() status?: string;
}
