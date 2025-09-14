import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    try {
        // Check if admin already exists
        const existingAdmin = await usersService.findByEmail('admin@skymoney.com');

        if (!existingAdmin) {
            // Create admin user
            const adminUser = await usersService.create({
                firstName: 'System',
                lastName: 'Administrator',
                email: 'admin@skymoney.com',
                phone: '+5511999999999',
                password: 'admin123456',
                role: UserRole.ADMIN,
                status: UserStatus.ACTIVE,
                adminApproved: true,
            });

            console.log('Admin user created successfully:', {
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
            });
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await app.close();
    }
}

seed();