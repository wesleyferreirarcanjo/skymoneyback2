import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

/**
 * Database configuration using environment variables
 * Environment variables:
 * - DATABASE_HOST: Database host (default: localhost)
 * - DATABASE_PORT: Database port (default: 5432)
 * - DATABASE_NAME: Database name (default: skymoneyback)
 * - DATABASE_USER: Database username (default: postgres)
 * - DATABASE_PASSWORD: Database password (default: password)
 * - DATABASE_SYNC: Enable database synchronization (default: true for development)
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'skymoneyback',
  entities: [User],
  synchronize: process.env.DATABASE_SYNC === 'true' || process.env.NODE_ENV !== 'production',
  logging: false,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: process.env.NODE_ENV === 'production',
  retryAttempts: 3,
  retryDelay: 3000,
  autoLoadEntities: true,
  keepConnectionAlive: true,
};
