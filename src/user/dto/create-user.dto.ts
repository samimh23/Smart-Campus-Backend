import { IsBoolean, IsOptional, IsArray, ArrayMaxSize, IsEnum, IsNumber, IsString, IsEmail } from "class-validator"
import { UserRole } from "../entities/role.enum"

export class CreateUserDto {
    @IsEmail()
    email
    @IsString()
    password
    @IsEnum(UserRole)
    role
    @IsString()
    first_name
    @IsString()
    last_name
    @IsString()
    username
    @IsNumber()
    phone

    @IsBoolean()
    is_active


    @IsEnum(UserRole)
  UserRole: UserRole;



  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3, { message: 'A teacher can have a maximum of 3 subjects' })
  subjectIds?: number[];
}
