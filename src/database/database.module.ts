import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { InitService } from './init.service';
import { DataGeneratorService } from './data-generator.service';
import { databaseConfig } from './database.config';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User]),
    UsersModule,
  ],
  providers: [DatabaseService, InitService, DataGeneratorService],
  exports: [DatabaseService, InitService, DataGeneratorService],
})
export class DatabaseModule {}
