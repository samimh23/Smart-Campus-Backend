import { IsString } from "class-validator"

export class Logindto{
    @IsString()
    email
    @IsString()
    password
}