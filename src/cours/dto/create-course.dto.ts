import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // 👇 Optional path to uploaded file
  @IsString()
  @IsOptional()
  filePath?: string;
}
