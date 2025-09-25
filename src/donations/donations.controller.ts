import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    UseGuards,
    Request,
    Query,
    ParseIntPipe,
    UseInterceptors,
    ClassSerializerInterceptor,
    UploadedFile,
    BadRequestException,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DonationsService } from './donations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
    DonationStatsDto,
    DonationToSendDto,
    DonationToReceiveDto,
    DonationHistoryDto,
    ComprovanteUploadResponseDto,
    DonationConfirmResponseDto,
    ComprovanteUrlResponseDto,
    DonationReportDto,
    DonationReportResponseDto,
    DonationUserReportsListDto,
    DonationUserReportItemDto,
    DonationUserReportsFiltersDto,
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

@Controller('donations')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) {}

    /**
     * GET /donations/stats
     * Retorna estatísticas de doação para o usuário autenticado
     */
    @Get('stats')
    async getStats(@Request() req): Promise<DonationStatsDto> {
        return this.donationsService.getStats(req.user.id);
    }

    /**
     * GET /donations/to-send
     * Retorna lista de doações que o usuário precisa fazer
     */
    @Get('to-send')
    async getToSend(@Request() req): Promise<DonationToSendDto[]> {
        return this.donationsService.getToSend(req.user.id);
    }

    /**
     * GET /donations/to-receive
     * Retorna lista de doações que o usuário está para receber
     */
    @Get('to-receive')
    async getToReceive(@Request() req): Promise<DonationToReceiveDto[]> {
        return this.donationsService.getToReceive(req.user.id);
    }

    /**
     * GET /donations/history
     * Retorna histórico de doações concluídas com paginação
     */
    @Get('history')
    async getHistory(
        @Request() req,
        @Query('page', ParseIntPipe) page: number = 1,
        @Query('limit', ParseIntPipe) limit: number = 20,
    ): Promise<DonationHistoryDto> {
        return this.donationsService.getHistory(req.user.id, page, limit);
    }

    /**
     * POST /donations/:id/comprovante
     * O doador envia o comprovante de uma doação
     */
    @Post(':id/comprovante')
    @UseInterceptors(FileInterceptor('comprovante'))
    async uploadComprovante(
        @Param('id') donationId: string,
        @Request() req,
        @UploadedFile() file: any,
        @Body('comprovanteBase64') comprovanteBase64?: string,
    ): Promise<ComprovanteUploadResponseDto> {
        if (!file && !comprovanteBase64) {
            throw new BadRequestException('Comprovante é obrigatório (arquivo ou base64)');
        }

        return this.donationsService.uploadComprovante(donationId, req.user.id, file, comprovanteBase64);
    }

    /**
     * PATCH /donations/:id/confirm
     * O recebedor confirma o recebimento de uma doação
     */
    @Patch(':id/confirm')
    async confirmDonation(
        @Param('id') donationId: string,
        @Request() req,
    ): Promise<DonationConfirmResponseDto> {
        return this.donationsService.confirmDonation(donationId, req.user.id);
    }

    /**
     * GET /donations/:id/comprovante
     * Obtém a URL para visualização segura de um comprovante
     */
    @Get(':id/comprovante')
    async getComprovanteUrl(
        @Param('id') donationId: string,
        @Request() req,
    ): Promise<ComprovanteUrlResponseDto> {
        return this.donationsService.getComprovanteUrl(donationId, req.user.id);
    }

    /**
     * POST /donations/:id/report
     * Reporta que não recebeu o valor da doação
     */
    @Post(':id/report')
    async reportDonationNotReceived(
        @Param('id') donationId: string,
        @Request() req,
        @Body() reportData: DonationReportDto,
    ): Promise<DonationReportResponseDto> {
        return this.donationsService.reportDonationNotReceived(
            donationId,
            req.user.id,
            reportData,
        );
    }

    /**
     * GET /donations/reports
     * Lista os reportes criados pelo usuário autenticado
     */
    @Get('reports')
    async getUserReports(
        @Request() req,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
        @Query('resolved') resolved?: string,
    ): Promise<DonationUserReportsListDto> {
        const filters: DonationUserReportsFiltersDto = {
            page: page || 1,
            limit: limit || 20,
            resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
        };

        return this.donationsService.getUserReports(req.user.id, filters);
    }

    /**
     * GET /donations/reports/:id
     * Detalhes de um reporte específico do usuário
     */
    @Get('reports/:id')
    async getUserReportDetails(
        @Param('id') donationId: string,
        @Request() req,
    ): Promise<DonationUserReportItemDto> {
        return this.donationsService.getUserReportDetails(donationId, req.user.id);
    }

    // ========================= ADMIN ROUTES (migrated) =========================
    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
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

    @Get('admin/list')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
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

    @Get('admin/reports')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
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

    @Get('admin/reports/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
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

    @Get('admin/reports/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getReportedDonationDetails(
        @Param('id') donationId: string,
    ): Promise<DonationReportAdminItemDto> {
        return this.donationsService.getAdminReportedDonationDetails(donationId);
    }

    @Post('admin/reports/:id/resolve')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async resolveDonationReport(
        @Param('id') donationId: string,
        @Body() resolutionData: DonationReportResolutionDto,
    ): Promise<DonationReportResolutionResponseDto> {
        return this.donationsService.resolveDonationReport(donationId, resolutionData);
    }

    @Get('admin/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async getDonationForAdmin(
        @Param('id') donationId: string,
    ): Promise<DonationAdminItemDto> {
        return this.donationsService.getDonationForAdmin(donationId);
    }

    /**
     * POST /donations/admin/cycle/:donationNumber/start
     * Starts the initial cycle by generating pending donations based on a 100-user queue pattern
     */
    @Post('admin/cycle/:donationNumber/start')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    async startCycle(
        @Param('donationNumber') donationNumber: string,
        @Body() body: { donorsCount: number; amount: number; type?: string; deadlineDays?: number },
    ) {
        const donorsCount = body.donorsCount ?? 3;
        const amount = body.amount;
        const type = body.type as any;
        const deadlineDays = body.deadlineDays;

        return this.donationsService.generateCycleDonations(
            parseInt(donationNumber, 10),
            donorsCount,
            amount,
            type,
            deadlineDays,
        );
    }

}
