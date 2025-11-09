import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refreshtoken.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ResetCode } from './entities/reset-code.entity';
import { Subject } from 'src/subject/entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, ResetCode ,Subject]), AuthModule
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
