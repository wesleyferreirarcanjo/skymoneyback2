const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function deleteOldAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get('UsersService');

  try {
    // Delete old admin user
    const oldAdmin = await usersService.findByEmail('admin@skymoneyback.com');
    if (oldAdmin) {
      console.log('Deleting old admin user...');
      await usersService.remove(oldAdmin.id);
      console.log('Old admin user deleted');
    }

    // Delete new admin user if exists
    const newAdmin = await usersService.findByEmail('admin@skymoney.com');
    if (newAdmin) {
      console.log('Deleting existing admin user...');
      await usersService.remove(newAdmin.id);
      console.log('Existing admin user deleted');
    }
  } catch (error) {
    console.error('Error deleting admin user:', error);
  } finally {
    await app.close();
  }
}

deleteOldAdmin();
