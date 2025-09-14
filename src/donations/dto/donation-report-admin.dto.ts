import { UserPublicProfileDto } from './user-public-profile.dto';

export class DonationReportAdminItemDto {
    id: string;
    amount: number;
    type: string;
    status: string;
    is_reported: boolean;
    report_reason?: string;
    report_additional_info?: string;
    reported_at?: Date;
    report_resolved: boolean;
    report_resolution?: string;
    report_admin_notes?: string;
    report_resolved_at?: Date;
    donor: UserPublicProfileDto;
    receiver: UserPublicProfileDto;
    created_at: Date;
    deadline?: Date;
    notes?: string;
}

export class DonationReportAdminListDto {
    data: DonationReportAdminItemDto[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
}

export class DonationReportAdminStatsDto {
    totalReports: number;
    totalAmountReported: number;
    reportsThisWeek: number;
    reportsThisMonth: number;
    averageReportAmount: number;
}

export class DonationReportAdminFiltersDto {
    page?: number = 1;
    limit?: number = 20;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    donorId?: string;
    receiverId?: string;
    type?: string;
}
