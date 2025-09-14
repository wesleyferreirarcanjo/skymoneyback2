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
    ): Promise<ComprovanteUploadResponseDto> {
        if (!file) {
            throw new BadRequestException('Arquivo de comprovante é obrigatório');
        }

        return this.donationsService.uploadComprovante(donationId, req.user.id, file);
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

}
