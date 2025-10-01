import {
    Controller,
    Get,
    Post,
    Param,
    UseGuards,
    Query,
    UseInterceptors,
    ClassSerializerInterceptor,
    Body,
} from '@nestjs/common';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
    DonationAdminStatsDto,
    DonationAdminListDto,
    DonationAdminItemDto,
    DonationAdminFiltersDto,
    DonationReportAdminListDto,
    DonationReportAdminItemDto,
    DonationReportAdminStatsDto,
    DonationReportAdminFiltersDto,
    DonationReportResolutionDto,
    DonationReportResolutionResponseDto,
} from './dto';

@Controller('admin/donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(ClassSerializerInterceptor)
export class AdminDonationsController {
    constructor(private readonly donationsService: DonationsService) {}

    @Get('stats')
    async getAdminStats(
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('donorId') donorId?: string,
        @Query('receiverId') receiverId?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('minAmount') minAmount?: string,
        @Query('maxAmount') maxAmount?: string,
    ): Promise<DonationAdminStatsDto> {
        const filters: DonationAdminFiltersDto = {
            status: status as any,
            type: type as any,
            donorId,
            receiverId,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        };

        return this.donationsService.getAdminStats(filters);
    }

    @Get('list')
    async getAllDonationsForAdmin(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('donorId') donorId?: string,
        @Query('receiverId') receiverId?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('minAmount') minAmount?: string,
        @Query('maxAmount') maxAmount?: string,
    ): Promise<DonationAdminListDto> {
        const filters: DonationAdminFiltersDto = {
            status: status as any,
            type: type as any,
            donorId,
            receiverId,
            dateFrom: dateFrom ? new Date(dateFrom) : undefined,
            dateTo: dateTo ? new Date(dateTo) : undefined,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        };

        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? parseInt(limit, 10) : 20;

        return this.donationsService.getAllDonationsForAdmin(filters, parsedPage, parsedLimit);
    }

    @Get('reports')
    async getReportedDonations(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('minAmount') minAmount?: string,
        @Query('maxAmount') maxAmount?: string,
        @Query('donorId') donorId?: string,
        @Query('receiverId') receiverId?: string,
        @Query('type') type?: string,
    ): Promise<DonationReportAdminListDto> {
        const filters: DonationReportAdminFiltersDto = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            dateFrom,
            dateTo,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            donorId,
            receiverId,
            type,
        };

        return this.donationsService.getAdminReportedDonations(filters);
    }

    @Get('reports/stats')
    async getReportedDonationsStats(
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('minAmount') minAmount?: string,
        @Query('maxAmount') maxAmount?: string,
        @Query('donorId') donorId?: string,
        @Query('receiverId') receiverId?: string,
        @Query('type') type?: string,
    ): Promise<DonationReportAdminStatsDto> {
        const filters: DonationReportAdminFiltersDto = {
            dateFrom,
            dateTo,
            minAmount: minAmount ? parseFloat(minAmount) : undefined,
            maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
            donorId,
            receiverId,
            type,
        };

        return this.donationsService.getAdminReportedDonationsStats(filters);
    }

    @Get('reports/:id')
    async getReportedDonationDetails(
        @Param('id') donationId: string,
    ): Promise<DonationReportAdminItemDto> {
        return this.donationsService.getAdminReportedDonationDetails(donationId);
    }

    @Post('reports/:id/resolve')
    async resolveDonationReport(
        @Param('id') donationId: string,
        @Body() resolutionData: DonationReportResolutionDto,
    ): Promise<DonationReportResolutionResponseDto> {
        return this.donationsService.resolveDonationReport(donationId, resolutionData);
    }

    @Get(':id')
    async getDonationForAdmin(
        @Param('id') donationId: string,
    ): Promise<DonationAdminItemDto> {
        return this.donationsService.getDonationForAdmin(donationId);
    }
}



