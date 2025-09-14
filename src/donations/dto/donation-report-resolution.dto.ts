import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum } from 'class-validator';

export enum ReportResolutionType {
    RESOLVED = 'RESOLVED',
    INVESTIGATING = 'INVESTIGATING',
    NEEDS_MORE_INFO = 'NEEDS_MORE_INFO',
    REJECTED = 'REJECTED',
}

export class DonationReportResolutionDto {
    @IsEnum(ReportResolutionType)
    @IsNotEmpty()
    resolution: ReportResolutionType;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    resolution_message: string;

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    admin_notes?: string;
}

export class DonationReportResolutionResponseDto {
    message: string;
    donationId: string;
    resolution: string;
    resolvedAt: Date;
}
