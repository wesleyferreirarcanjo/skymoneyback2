import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connection successful');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get database connection status
   */
  async getConnectionStatus() {
    const isConnected = await this.testConnection();
    const options = this.dataSource.options as any; // Type assertion for PostgreSQL options
    return {
      connected: isConnected,
      host: options.host,
      port: options.port,
      database: options.database,
      username: options.username,
      synchronize: options.synchronize,
      logging: options.logging,
    };
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      await this.dataSource.runMigrations();
      this.logger.log('Database migrations completed successfully');
    } catch (error) {
      this.logger.error('Database migrations failed:', error.message);
      throw error;
    }
  }

  /**
   * Revert last migration
   */
  async revertLastMigration(): Promise<void> {
    try {
      await this.dataSource.undoLastMigration();
      this.logger.log('Last migration reverted successfully');
    } catch (error) {
      this.logger.error('Migration revert failed:', error.message);
      throw error;
    }
  }
}
