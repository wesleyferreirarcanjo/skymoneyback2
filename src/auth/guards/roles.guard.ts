import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log(`[DEBUG] RolesGuard - Required roles:`, requiredRoles);

    if (!requiredRoles) {
      console.log(`[DEBUG] RolesGuard - No required roles, allowing access`);
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    console.log(`[DEBUG] RolesGuard - User from request:`, user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : 'undefined');

    if (!user) {
      console.log(`[DEBUG] RolesGuard - No user found in request`);
      return false;
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    console.log(`[DEBUG] RolesGuard - User has required role:`, hasRequiredRole);

    return hasRequiredRole;
  }
}