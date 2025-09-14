import { UserPublicProfileDto } from './user-public-profile.dto';

export class DonationUserReportItemDto {
    id: string;
    amount: number;
    type: string;
    status: string;
    report_reason: string;
    report_additional_info?: string;
    reported_at: Date;
    report_resolved: boolean;
    report_resolution?: string;
    report_resolution_message?: string;
    report_resolved_at?: Date;
    donor: UserPublicProfileDto;
    receiver: UserPublicProfileDto;
    created_at: Date;
    deadline?: Date;
}

export class DonationUserReportsListDto {
    data: DonationUserReportItemDto[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
}

export class DonationUserReportsFiltersDto {
    page?: number = 1;
    limit?: number = 20;
    resolved?: boolean; // true para resolvidos, false para pendentes, undefined para todos
}
