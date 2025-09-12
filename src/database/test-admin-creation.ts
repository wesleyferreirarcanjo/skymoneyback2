import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function testAdminCreation() {
  console.log('🔍 Testing admin user creation...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Wait a moment for the InitService to run
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const adminUser = await usersService.findByEmail('admin@skymoney.com');
    
    if (adminUser) {
      console.log('✅ Admin user found successfully!');
      console.log('Admin user details:');
      console.log(`  ID: ${adminUser.id}`);
      console.log(`  Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  Status: ${adminUser.status}`);
      console.log(`  Admin Approved: ${adminUser.adminApproved}`);
      console.log(`  PIX Key: ${adminUser.pixKey}`);
      console.log(`  Created At: ${adminUser.createdAt}`);
    } else {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing admin creation:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

testAdminCreation();
