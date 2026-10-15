import { IsJSON, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDoctorDto {
  @IsString() @IsNotEmpty() userId!: string;
  @IsString() @IsNotEmpty() specialty!: string;
  @IsString() @IsNotEmpty() licenseNumber!: string;
  @IsOptional() @IsJSON() availability?: string;
  @IsOptional() @IsString() bio?: string;
}

export class UpdateDoctorDto {
  @IsOptional() @IsString() specialty?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsJSON() availability?: string;
  @IsOptional() @IsString() bio?: string;
}
