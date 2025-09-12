import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { InitService } from './init.service';
import { databaseConfig } from './database.config';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [DatabaseService, InitService],
  exports: [DatabaseService, InitService],
})
export class DatabaseModule {}
