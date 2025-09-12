import { IsUUID, IsInt, Min } from 'class-validator';

export class MoveUserPositionDto {
    @IsUUID('4')
    user_id: string;

    @IsInt()
    @Min(1)
    donation_number: number;
}

export class MoveReceiverToEndDto {
    @IsInt()
    @Min(1)
    donation_number: number;
}

export class AdvanceQueueDto {
    @IsInt()
    @Min(1)
    donation_number: number;
}

export class MoveUserToEndDto {
    @IsUUID('4')
    user_id: string;

    @IsInt()
    @Min(1)
    donation_number: number;
}
