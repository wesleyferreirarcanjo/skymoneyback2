import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getHello(): string {
    console.log(`[DEBUG] AppController - getHello called`);
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    console.log(`[DEBUG] AppController - getHealth called`);

    const dbStatus = await this.databaseService.getConnectionStatus();
    console.log(`[DEBUG] AppController - Database status:`, dbStatus);

    const response = {
      status: dbStatus.connected ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbStatus.connected,
        host: dbStatus.host,
        port: dbStatus.port,
        database: dbStatus.database,
      },
    };

    console.log(`[DEBUG] AppController - Health response:`, response);
    return response;
  }
}
