import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { Queue } from './entities/queue.entity';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Queue]),
        UsersModule,
    ],
    controllers: [QueueController],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule {}
