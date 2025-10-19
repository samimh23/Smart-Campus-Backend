import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateSubmissionDto {
  @IsNumber()
  @IsNotEmpty()
  homework_id: number;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  attachment_url?: string;
}

export class UpdateSubmissionDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  attachment_url?: string;

  @IsOptional()
  @IsBoolean()
  is_submitted?: boolean;
}
