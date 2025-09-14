import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { AdminDonationsController } from './admin-donations.controller';
import { DonationsBusinessService } from './donations-business.service';
import { Donation } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { QueueModule } from '../queue/queue.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Donation, User]),
        QueueModule,
        MulterModule.register({
            dest: './uploads/comprovantes',
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
            fileFilter: (req, file, callback) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
                    return callback(new Error('Apenas arquivos JPG e PNG são permitidos'), false);
                }
                callback(null, true);
            },
        }),
    ],
    controllers: [DonationsController, AdminDonationsController],
    providers: [
        DonationsService,
        DonationsBusinessService,
        FileUploadService,
    ],
    exports: [DonationsService, DonationsBusinessService],
})
export class DonationsModule {}
