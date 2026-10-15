import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateInsuranceDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() code!: string;
  @IsOptional() @IsNumber() @Min(0) coverageRate?: number;
}

export class CreateInsurancePolicyDto {
  @IsString() @IsNotEmpty() patientId!: string;
  @IsString() @IsNotEmpty() insuranceId!: string;
  @IsString() @IsNotEmpty() policyNumber!: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsNumber() coverageRate?: number;
}
