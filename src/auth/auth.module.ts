// src/auth/auth.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Protect } from './auth-guard';
import { User } from 'src/user/entities/user.entity';

@Global() // ✅ rends le module accessible partout
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dggredg,erg,ergz464rzerr', // ✅ utilise un secret
      signOptions: {},
    }),
  ],
  providers: [Protect],
  exports: [
    Protect,
    TypeOrmModule,
    JwtModule,
  ],
})
export class AuthModule {}
