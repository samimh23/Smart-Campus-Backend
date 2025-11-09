import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt'
import { Logindto } from './dto/login.dto';
import { first } from 'rxjs';
import { RefreshToken } from './entities/refreshtoken.entity';
import {v4 as uuidv4} from 'uuid'
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './entities/role.enum';
import { ResetCode } from './entities/reset-code.entity';
import { ActiverDto } from './dto/activer.dto';
import * as nodemailer from 'nodemailer';
import { title } from 'process';
import { Subject } from 'src/subject/entities/subject.entity'; 
import { In } from 'typeorm';



@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshrepo: Repository<RefreshToken>,
    private readonly jwtservice: JwtService,
      @InjectRepository(Subject)
    private readonly subjectRepo: Repository<Subject>, // ✅ added safely
       @InjectRepository(ResetCode)
    private readonly resetRepo: Repository<ResetCode>,
  ){}


  async signup(createUserDto: CreateUserDto) {
  // Vérifier si l'email ou le téléphone existe déjà
  const existingUser = await this.userRepo.findOne({
    where: [
      { email: createUserDto.email },
      { phone: createUserDto.phone }
    ]
  });

  if (existingUser) {
    throw new BadRequestException('Email or phone already in use');
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const user = this.userRepo.create({
    ...createUserDto,
    password: hashedPassword,
    is_active: false // l'utilisateur sera activé plus tard via activerCompte
  });

  await this.userRepo.save(user);

  return { success: true, message: 'User created successfully', userId: user.id };
}


  async login(login: Logindto, res){
    
    let user = await this.userRepo.findOne({
      where: { email: login.email }
    })

    if (!user) {
      throw new BadRequestException('wrong login')
    }

    const is_correcte = await bcrypt.compare(login.password, user.password)

    if(!is_correcte){
      throw new BadRequestException('wrong passwor')
    }

    const { accessToken, refreshToken } = await this.generateUserTokens(user)



    // 🍪 Set cookie
    res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000, // 1 hour
          sameSite: 'lax',
    })

    return {
      token: accessToken,
      user
    }

    // return await bcrypt.hash('password', 10);
  }





  async createUserByAdmin(adminUser: User, createUserDto: CreateUserDto & { role: UserRole }) {
  if (adminUser.role !== UserRole.ADMIN) {
    throw new ForbiddenException('Only admin can create users');
  }

  const existingUser = await this.userRepo.findOne({
    where: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
  });

  if (existingUser) throw new BadRequestException('Email or phone already used');

  const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  const user = this.userRepo.create({
    ...createUserDto,
    password: hashedPassword,
    is_active: true,
  });

  // ✅ Si c’est un teacher, associer les matières
  if (createUserDto.role === UserRole.TEACHER && createUserDto.subjectIds?.length) {
  if (createUserDto.subjectIds.length > 3) {
    throw new BadRequestException('A teacher can have a maximum of 3 subjects');
  }
  const subjects = await this.subjectRepo.findBy({ id: In(createUserDto.subjectIds) });
  user.subjects = subjects;
}


  await this.userRepo.save(user);
  return { success: true, message: 'User created by admin', userId: user.id };
}



  




  async sendResetCode(email: string) {
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) throw new BadRequestException('User not found');

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Save to ResetCode entity
  const resetCode = this.resetRepo.create({
    code,
    user,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // expires in 10 mins
  });
  await this.resetRepo.save(resetCode);
  
  console.log(`OTP for ${email}: ${code}`); // just log OTP
  return { success: true, message: 'OTP generated', otp: code };
  // Send email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Code',
    text: `Your OTP code is: ${code}`,
  });

  return { success: true, message: 'OTP sent to your email' };
}



async verifyResetCode(email: string, code: string) {
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) throw new BadRequestException('User not found');

  const resetCode = await this.resetRepo.findOne({
    where: { user: { id: user.id }, code },
  });

  if (!resetCode || resetCode.expiresAt < new Date()) {
    throw new BadRequestException('Invalid or expired code');
  }

  return { success: true, message: 'OTP verified', userId: user.id };
}





async resetPassword(email: string, otp: string, newPassword: string) {
  const user = await this.userRepo.findOne({ where: { email } });
  if (!user) throw new BadRequestException('User not found');

  const resetCode = await this.resetRepo.findOne({
    where: { user: { id: user.id }, code: otp },
  });

  if (!resetCode || resetCode.expiresAt < new Date()) {
    throw new BadRequestException('Invalid or expired OTP');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await this.userRepo.save(user);

  // Remove used reset code
  await this.resetRepo.remove(resetCode);

  return { success: true, message: 'Password reset successfully' };
}








  async verifyEmail(email: string){
    let user = await this.userRepo.findOne({ where: { email: email } })
    if(user){
      return { inUse: true }
    }
    return { inUse: false }
  }

  async verifyPhone(phone: number){
    let user = await this.userRepo.findOne({ where: { phone: phone } })
    if(user){
      return { inUse: true }
    }
    return { inUse: false }
  }

  async activerCompte(data: ActiverDto){
    // Later: validate
    const validCode = await this.resetRepo.findOne({
      where: {
        code: data.code,
        user: { id: data.user_id },
      },
      // relations: ['user'],
    });

    if (!validCode || validCode.expiresAt < new Date()) {
      throw new BadRequestException('Code expired or invalid');
    }


    const user = await this.userRepo.findOne({ where: { id: data.user_id } })
    if (!user) {
      throw new BadRequestException('User not found');
    }
    // console.log(data)

    if(user.is_active){
      throw new BadRequestException('User already activated')
    }

    const hashedpassword = await bcrypt.hash(data.password, 10);
    user.password = hashedpassword;
    user.is_active = true;
    await this.userRepo.save(user)
    return { success: true, message: 'Compte active avec succée' }
  }




  async findByRole(role: UserRole): Promise<User[]> {
  const users = await this.userRepo.find({
    where: { role },
    order: { first_name: 'ASC' }, 
  });

  if (!users.length) {
    throw new BadRequestException(`No users found with role: ${role}`);
  }

  return users;
}


  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepo.find({
      where: { role },
      order: { first_name: 'ASC' }
    });
  }


  async generateUserTokens(user: User) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtservice.sign(payload, { noTimestamp: true });
    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, user);
    return { accessToken, refreshToken };
  }

  async storeRefreshToken(token: string, user: User) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    await this.refreshrepo.save({ user, token, expiresAt: expiryDate });
  }





  async toggleUserActivation(adminUser: User, userId: number, activate: boolean) {
  if (adminUser.role !== UserRole.ADMIN) {
    throw new ForbiddenException('Only admin can change activation status');
  }

  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new BadRequestException('User not found');
  }

  if (user.role === UserRole.ADMIN) {
    throw new ForbiddenException('Cannot deactivate another admin');
  }

  user.is_active = activate;
  await this.userRepo.save(user);

  return {
    success: true,
    message: activate
      ? `User ${user.first_name} ${user.last_name} activated successfully`
      : `User ${user.first_name} ${user.last_name} deactivated successfully`,
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    },
  };
}






  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll(): Promise<User[]> {
    return await this.userRepo.find({
      where: {email: "email@gmail.com"}
    });
  }

  async findOne(id: number) {
    await this.userRepo.findOne({
      where: { id }
    })
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async activateTestAccounts() {
    // Créer un compte enseignant s'il n'existe pas
    const teacherExists = await this.userRepo.findOne({ where: { email: 'teacher@test.com' } });
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const teacher = this.userRepo.create({
        first_name: 'Marie',
        last_name: 'Teacher',
        email: 'teacher@test.com',
        password: hashedPassword,
        role: UserRole.TEACHER,
        username: 'marie.teacher',
        phone: 1234567890,
        is_active: true
      });
      await this.userRepo.save(teacher);
    }

    // Créer un compte étudiant s'il n'existe pas
    const studentExists = await this.userRepo.findOne({ where: { email: 'student@test.com' } });
    if (!studentExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const student = this.userRepo.create({
        first_name: 'Pierre',
        last_name: 'Student',
        email: 'student@test.com',
        password: hashedPassword,
        role: UserRole.STUDENT,
        username: 'pierre.student',
        phone: 1234567891,
        is_active: true
      });
      await this.userRepo.save(student);
    }

    // Activer tous les comptes de test existants
    await this.userRepo.update(
      { email: 'marie.martin@test.com' },
      { is_active: true }
    );
    
    await this.userRepo.update(
      { email: 'pierre.durand@test.com' },
      { is_active: true }
    );

    await this.userRepo.update(
      { email: 'wiem.ayari@esprit.tn' },
      { is_active: true }
    );

    return { success: true, message: 'Test accounts created and activated' };
  }

  async createTestAccounts() {
    try {
      // Créer un compte enseignant
      const teacherExists = await this.userRepo.findOne({ where: { email: 'teacher@test.com' } });
      if (!teacherExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const teacher = this.userRepo.create({
          first_name: 'Marie',
          last_name: 'Teacher',
          email: 'teacher@test.com',
          password: hashedPassword,
          role: UserRole.TEACHER,
          username: 'marie.teacher',
          phone: 1234567890,
          is_active: true
        });
        await this.userRepo.save(teacher);
      }

      // Créer un compte étudiant
      const studentExists = await this.userRepo.findOne({ where: { email: 'student@test.com' } });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const student = this.userRepo.create({
          first_name: 'Pierre',
          last_name: 'Student',
          email: 'student@test.com',
          password: hashedPassword,
          role: UserRole.STUDENT,
          username: 'pierre.student',
          phone: 1234567891,
          is_active: true
        });
        await this.userRepo.save(student);
      }

      return { success: true, message: 'Test accounts created' };
    } catch (error) {
      console.error('Error creating test accounts:', error);
      return { success: false, message: 'Error creating test accounts', error: error.message };
    }
  }



async logout(userId: number) {
  await this.refreshrepo.delete({ user: { id: userId } });
  return { success: true, message: 'Logged out successfully' };
}


  

}
