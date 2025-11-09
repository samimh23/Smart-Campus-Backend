// src/courses/dto/create-course.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  filePath?: string;

  @IsArray()
  @IsOptional()
  classIds?: number[];

  @IsNumber()
  @IsOptional()
  subject_id?: number;

  @IsString()
  @IsOptional()
  subject?: string; // Keep this for backward compatibility
}