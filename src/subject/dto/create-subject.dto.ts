import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  teachers?: number[]; // teacher IDs
}
