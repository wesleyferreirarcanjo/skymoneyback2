import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { InitService } from './init.service';
import { DataGeneratorService } from './data-generator.service';
import { databaseConfig } from './database.config';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [DatabaseService, InitService, DataGeneratorService, UsersService],
  exports: [DatabaseService, InitService, DataGeneratorService],
})
export class DatabaseModule {}
