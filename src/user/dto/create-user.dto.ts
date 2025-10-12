import { IsBoolean, IsEmail, IsEnum, IsNumber, IsString } from "class-validator"
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
}
