import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Logindto } from './dto/login.dto';
import { Protect } from 'src/auth/auth-guard';
import { CurrentUser } from 'src/common/decorators/current-user.decoratir';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from './entities/role.enum';
import { ActiverDto } from './dto/activer.dto';

@Controller('auth')
export class UserController {
  constructor(private readonly userService: UserService) {}


  @UseGuards(Protect)
  @Get('/user/me')
  test(@CurrentUser() user){
    return user
  }


 

  @Post('/signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUserByAdmin(
      { role: UserRole.ADMIN } as any, // fake admin to assign STUDENT role
      { ...createUserDto, role: UserRole.STUDENT },
    );
  }


   


  @UseGuards(Protect)
  @Roles(UserRole.ADMIN)
  @Post('/admin/create-user')
  async createUserByAdmin(
    @CurrentUser() user,
    @Body() createUserDto: CreateUserDto & { role: UserRole },
  ) {
    return this.userService.createUserByAdmin(user, createUserDto);
  }

  @Post('/login')
  login(@Body() user: Logindto, @Res({ passthrough: true }) res){
    return this.userService.login(user, res);
  }





  @Post('/forgot-password')
async forgotPassword(@Body('email') email: string) {
  return this.userService.sendResetCode(email);
}

@Post('/verify-otp')
async verifyOtp(@Body() body: { email: string, code: string }) {
  return this.userService.verifyResetCode(body.email, body.code);
}

@Post('/reset-password')
async resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
  return this.userService.resetPassword(body.email, body.otp, body.newPassword);
}




  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(Protect)
  @Roles(UserRole.ADMIN)
  @Post('/verifyemail')
  verfiyEmail(@Body() data: any){
    return this.userService.verifyEmail(data.email)
  }

  @UseGuards(Protect)
  @Roles(UserRole.ADMIN)
  @Post('/verifyphone')
  verfiyPhone(@Body() data: any){
    return this.userService.verifyPhone(data.phone)
  }

  @Post('/activer')
  activerCompte(@Body() data: ActiverDto ){
    // console.log(data)
    return this.userService.activerCompte(data)
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }





  @Post('/create-initial-admin')
  async createInitialAdmin() {
    return this.userService.signup({
      first_name: 'Wiem',
      last_name: 'Ayari',
      email: 'wiem.ayari@esprit.tn',
      password: 'admin123',
      role: UserRole.ADMIN,
      username: undefined,
      phone: undefined,
      is_active: undefined
    });
  }

  
}
