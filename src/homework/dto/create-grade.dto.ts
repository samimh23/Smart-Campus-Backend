import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateGradeDto {
  @IsNumber()
  @IsNotEmpty()
  submission_id: number;

  @IsNumber()
  @Min(0)
  @Max(20)
  grade: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  is_final?: boolean;
}

export class UpdateGradeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  grade?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsBoolean()
  is_final?: boolean;
}
