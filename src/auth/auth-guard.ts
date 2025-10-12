// src/auth/guards/protect.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { UserRole } from '../user/entities/role.enum';

@Injectable()
export class Protect implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const data = await this.jwtService.verify(token, { ignoreExpiration: false });

      // Find base user
      // const user = await this.userRepo.findOne({ where: { id: payload.userId } });
      // if (!user) throw new UnauthorizedException('User not found');

      const user = data.user
      // Role check
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new ForbiddenException(`Requires one of roles: ${requiredRoles.join(', ')}`);
      }

      // Load role-specific profile
      let profile = null;
      // console.log(user)
      switch (user.role) {//get each profile from its repo
        case UserRole.ADMIN:
          profile = user; // Admin might not have a separate profile
          break;
        case UserRole.TEACHER:
          profile = user;
          break;
        case UserRole.STUDENT:
          profile = user;
          break;
      }

      request.user = { ...user, profile };
      // request.user = profile
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}