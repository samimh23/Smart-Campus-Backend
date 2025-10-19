import { IsNotEmpty, IsString } from "class-validator";

export class ActiverDto{
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    user_id: number;


    @IsString()
    @IsNotEmpty()
    password: string;
}