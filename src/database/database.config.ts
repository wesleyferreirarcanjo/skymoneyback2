import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Queue } from '../queue/entities/queue.entity';

/**
 * Database configuration using environment variables
 * Environment variables:
 * - DATABASE_HOST: Database host (default: localhost)
 * - DATABASE_PORT: Database port (default: 5432)
 * - DATABASE_NAME: Database name (default: skymoneyback)
 * - DATABASE_USER: Database username (default: postgres)
 * - DATABASE_PASSWORD: Database password (default: password)
 * - DATABASE_SYNC: Enable database synchronization (default: true for development)
 * - DATABASE_LOGGING: Enable TypeORM logging (default: false in production, errors/warnings in development)
 * - NODE_ENV: Application environment (development/production)
 */
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || '72.60.59.203',
  port: parseInt(process.env.DATABASE_PORT) || 5433,
  username: process.env.DATABASE_USER || 'admin',
  password: process.env.DATABASE_PASSWORD || 'admin123',
  database: process.env.DATABASE_NAME || 'sky-money-ai',
  entities: [User, Queue],
  synchronize: process.env.DATABASE_SYNC === 'true' || process.env.NODE_ENV !== 'production',
  logging: process.env.DATABASE_LOGGING === 'true' 
    ? ['query', 'error', 'warn', 'info', 'log', 'schema'] 
    : process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : false,
  logger: process.env.NODE_ENV === 'development' ? 'advanced-console' : 'simple-console',
  maxQueryExecutionTime: 1000, // Log queries that take more than 1 second
  ssl: false,
  migrations: ['dist/database/migrations/*.js'],
  migrationsRun: process.env.NODE_ENV === 'production',
  retryAttempts: 3,
  retryDelay: 3000,
  autoLoadEntities: true,
  keepConnectionAlive: true,
};
