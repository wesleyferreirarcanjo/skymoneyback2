import { UserPublicProfileDto } from './user-public-profile.dto';

export class DonationHistoryItemDto {
    id: string;
    amount: number;
    type: string;
    status: string;
    created_at: Date;
    updated_at: Date;
    completed_at: Date;
    deadline?: Date;
    notes?: string;
    comprovante_url?: string;
    // Report information
    is_reported: boolean;
    report_reason?: string;
    report_additional_info?: string;
    reported_at?: Date;
    report_resolved: boolean;
    report_resolution?: string;
    report_resolution_message?: string;
    report_resolved_at?: Date;
    role: 'DONOR' | 'RECEIVER';
    donor: UserPublicProfileDto;
    receiver: UserPublicProfileDto;
}

export class DonationHistoryPaginationDto {
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export class DonationHistoryDto {
    data: DonationHistoryItemDto[];
    pagination: DonationHistoryPaginationDto;
}
