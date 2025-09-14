import { UserPublicProfileDto } from './user-public-profile.dto';
import { DonationStatus, DonationType } from '../entities/donation.entity';

export class DonationAdminItemDto {
    id: string;
    amount: number;
    type: DonationType;
    status: DonationStatus;
    donor: UserPublicProfileDto;
    receiver: UserPublicProfileDto;
    comprovante_url?: string;
    deadline?: Date;
    completed_at?: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

export class DonationAdminStatsDto {
    totalDonations: number;
    totalAmount: number;
    pendingPayment: number;
    pendingConfirmation: number;
    confirmed: number;
    expired: number;
    cancelled: number;
    totalUsersWithDonations: number;
    averageDonationAmount: number;
}

export class DonationAdminListDto {
    data: DonationAdminItemDto[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
    stats: DonationAdminStatsDto;
}

export class DonationAdminFiltersDto {
    status?: DonationStatus;
    type?: DonationType;
    donorId?: string;
    receiverId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
}
