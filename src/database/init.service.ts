import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitService implements OnModuleInit {
  private readonly logger = new Logger(InitService.name);

  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    await this.createAdminUser();
  }

  private async createAdminUser() {
    try {
      // Check if admin already exists
      const existingAdmin = await this.usersService.findByEmail('admin@skymoney.com');

      if (!existingAdmin) {
        this.logger.log('Creating admin user...');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123456', 12);
        
        // Create admin user with all required fields
        const adminUser = await this.usersService.create({
          firstName: 'Admin',
          lastName: 'SkyMoney',
          email: 'admin@skymoney.com',
          phone: '+5511999999999',
          password: hashedPassword,
          pixKey: 'admin@skymoney.com',
          role: UserRole.ADMIN,
          status: UserStatus.APPROVED,
          adminApproved: true,
          adminApprovedAt: new Date(),
        });

        this.logger.log('Admin user created successfully:', {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
          status: adminUser.status,
        });
      } else {
        this.logger.log('Admin user already exists');
      }
    } catch (error) {
      this.logger.error('Error creating admin user:', error.message);
    }
  }
}
