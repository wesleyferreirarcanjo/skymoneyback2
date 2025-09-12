import { PartialType } from '@nestjs/mapped-types';
import { CreateQueueDto } from './create-queue.dto';
import { IsOptional, IsInt, Min } from 'class-validator';

export class UpdateQueueDto extends PartialType(CreateQueueDto) {
    @IsOptional()
    @IsInt()
    @Min(1)
    position?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    donation_number?: number; // Number of donations received (count)
}
