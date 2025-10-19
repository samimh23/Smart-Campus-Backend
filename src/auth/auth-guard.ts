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
import { UserRole } from 'src/user/entities/role.enum';

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
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      // Verify token
      const data: any = this.jwtService.verify(token); // default secret from JwtModule

      // Load user from database
      const user = await this.userRepo.findOne({ where: { id: data.id } });
      if (!user) throw new UnauthorizedException('User not found');

      // Role check
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new ForbiddenException(
          `Requires one of roles: ${requiredRoles.join(', ')}`,
        );
      }

      // Attach user to request
      request.user = user;

      return true;
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
