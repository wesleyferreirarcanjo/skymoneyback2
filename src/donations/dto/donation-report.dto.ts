import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class DonationReportDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    additionalInfo?: string;
}

export class DonationReportResponseDto {
    message: string;
    donationId: string;
    reportedAt: Date;
}
