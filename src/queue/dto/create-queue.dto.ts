import {
    IsUUID,
    IsInt,
    IsBoolean,
    IsOptional,
    IsArray,
    Min,
} from 'class-validator';

export class CreateQueueDto {
    @IsInt()
    @Min(1)
    position: number;

    @IsInt()
    @Min(1)
    donation_number: number; // Number of donations received (count)

    @IsOptional()
    @IsBoolean()
    is_receiver?: boolean;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    passed_user_ids?: string[];

    @IsUUID('4')
    user_id: string;
}
