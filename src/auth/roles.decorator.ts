import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/entities/role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
