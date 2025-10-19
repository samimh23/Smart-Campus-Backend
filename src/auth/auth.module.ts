// auth.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { Protect } from './auth-guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

// @Global() // Add this decorator
@Module({
  imports: [
    TypeOrmModule.forFeature(
        [User]
    ),
  ],
  providers: [Protect],
  exports: [Protect, 
    TypeOrmModule.forFeature(
        [User]
    ),],
})
export class AuthModule {}