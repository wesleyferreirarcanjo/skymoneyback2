import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Donation, DonationStatus, DonationType } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { DonationsBusinessService } from './donations-business.service';
import {
    DonationStatsDto,
    DonationToSendDto,
    DonationToReceiveDto,
    DonationHistoryDto,
    DonationHistoryItemDto,
    DonationHistoryPaginationDto,
    UserPublicProfileDto,
    ComprovanteUploadResponseDto,
    DonationConfirmResponseDto,
    ComprovanteUrlResponseDto,
    DonationAdminItemDto,
    DonationAdminStatsDto,
    DonationAdminListDto,
    DonationAdminFiltersDto,
    DonationReportDto,
    DonationReportResponseDto,
    DonationReportAdminItemDto,
    DonationReportAdminListDto,
    DonationReportAdminStatsDto,
    DonationReportAdminFiltersDto,
    DonationReportResolutionDto,
    DonationReportResolutionResponseDto,
    DonationUserReportsListDto,
    DonationUserReportItemDto,
    DonationUserReportsFiltersDto,
} from './dto';

@Injectable()
export class DonationsService {
    private readonly logger = new Logger(DonationsService.name);

    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private dataSource: DataSource,
        private fileUploadService: FileUploadService,
        private donationsBusinessService: DonationsBusinessService,
    ) {}

    /**
     * Get donation statistics for a user
     */
    async getStats(userId: string): Promise<DonationStatsDto> {
        const totalDonatedResult = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'total')
            .where('donation.donor_id = :userId', { userId })
            .andWhere('donation.status = :status', { status: DonationStatus.CONFIRMED })
            .getRawOne();

        const totalReceivedResult = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'total')
            .where('donation.receiver_id = :userId', { userId })
            .andWhere('donation.status = :status', { status: DonationStatus.CONFIRMED })
            .getRawOne();

        const pendingToSend = await this.donationsRepository.count({
            where: {
                donor_id: userId,
                status: DonationStatus.PENDING_PAYMENT,
            },
        });

        const pendingToReceive = await this.donationsRepository.count({
            where: [
                { receiver_id: userId, status: DonationStatus.PENDING_PAYMENT },
                { receiver_id: userId, status: DonationStatus.PENDING_CONFIRMATION },
            ],
        });

        return {
            totalDonated: parseFloat(totalDonatedResult?.total || '0'),
            totalReceived: parseFloat(totalReceivedResult?.total || '0'),
            pendingToSend,
            pendingToReceive,
        };
    }

    /**
     * Get donations to send for a user
     */
    async getToSend(userId: string): Promise<DonationToSendDto[]> {
        const donations = await this.donationsRepository.find({
            where: {
                donor_id: userId,
                status: DonationStatus.PENDING_PAYMENT,
            },
            relations: ['receiver'],
            order: { created_at: 'ASC' },
        });

        return donations.map(donation => ({
            id: donation.id,
            amount: parseFloat(donation.amount.toString()),
            type: donation.type,
            status: donation.status,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
            deadline: donation.deadline,
            completed_at: donation.completed_at,
            notes: donation.notes,
            comprovante_url: donation.comprovante_url,
            // Report information
            is_reported: donation.is_reported,
            report_reason: donation.report_reason,
            report_additional_info: donation.report_additional_info,
            reported_at: donation.reported_at,
            report_resolved: donation.report_resolved,
            report_resolution: donation.report_resolution,
            report_resolution_message: donation.report_admin_notes,
            report_resolved_at: donation.report_resolved_at,
            receiver: this.mapUserToPublicProfile(donation.receiver),
        }));
    }

    /**
     * Get donations to receive for a user
     */
    async getToReceive(userId: string): Promise<DonationToReceiveDto[]> {
        const donations = await this.donationsRepository.find({
            where: [
                { receiver_id: userId, status: DonationStatus.PENDING_PAYMENT },
                { receiver_id: userId, status: DonationStatus.PENDING_CONFIRMATION },
            ],
            relations: ['donor'],
            order: { created_at: 'ASC' },
        });

        return donations.map(donation => ({
            id: donation.id,
            amount: parseFloat(donation.amount.toString()),
            type: donation.type,
            status: donation.status,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
            deadline: donation.deadline,
            completed_at: donation.completed_at,
            notes: donation.notes,
            comprovante_url: donation.comprovante_url,
            // Report information
            is_reported: donation.is_reported,
            report_reason: donation.report_reason,
            report_additional_info: donation.report_additional_info,
            reported_at: donation.reported_at,
            report_resolved: donation.report_resolved,
            report_resolution: donation.report_resolution,
            report_resolution_message: donation.report_admin_notes,
            report_resolved_at: donation.report_resolved_at,
            donor: this.mapUserToPublicProfile(donation.donor),
        }));
    }

    /**
     * Get donation history with pagination
     */
    async getHistory(
        userId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<DonationHistoryDto> {
        const offset = (page - 1) * limit;

        const [donations, total] = await this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.donor_id = :userId OR donation.receiver_id = :userId', { userId })
            .andWhere('donation.status = :status', { status: DonationStatus.CONFIRMED })
            .orderBy('donation.completed_at', 'DESC')
            .skip(offset)
            .take(limit)
            .getManyAndCount();

        const data: DonationHistoryItemDto[] = donations.map(donation => ({
            id: donation.id,
            amount: parseFloat(donation.amount.toString()),
            type: donation.type,
            status: donation.status,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
            completed_at: donation.completed_at!,
            deadline: donation.deadline,
            notes: donation.notes,
            comprovante_url: donation.comprovante_url,
            // Report information
            is_reported: donation.is_reported,
            report_reason: donation.report_reason,
            report_additional_info: donation.report_additional_info,
            reported_at: donation.reported_at,
            report_resolved: donation.report_resolved,
            report_resolution: donation.report_resolution,
            report_resolution_message: donation.report_admin_notes,
            report_resolved_at: donation.report_resolved_at,
            role: donation.donor_id === userId ? 'DONOR' : 'RECEIVER',
            donor: this.mapUserToPublicProfile(donation.donor),
            receiver: this.mapUserToPublicProfile(donation.receiver),
        }));

        const pagination: DonationHistoryPaginationDto = {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
        };

        return { data, pagination };
    }

    /**
     * Upload comprovante for a donation
     */
    async uploadComprovante(
        donationId: string,
        userId: string,
        file: any,
    ): Promise<ComprovanteUploadResponseDto> {
        const donation = await this.donationsRepository.findOne({
            where: { id: donationId },
            relations: ['donor', 'receiver'],
        });

        if (!donation) {
            throw new NotFoundException('Doação não encontrada');
        }

        if (donation.donor_id !== userId) {
            throw new ForbiddenException('Apenas o doador pode enviar comprovante');
        }

        if (donation.status !== DonationStatus.PENDING_PAYMENT) {
            throw new BadRequestException('Esta doação não está aguardando pagamento');
        }

        // Delete old comprovante if exists
        if (donation.comprovante_url) {
            await this.fileUploadService.deleteFile(donation.comprovante_url);
        }

        // Upload new file
        const comprovanteUrl = await this.fileUploadService.uploadFile(file, donationId);

        donation.comprovante_url = comprovanteUrl;
        donation.status = DonationStatus.PENDING_CONFIRMATION;

        await this.donationsRepository.save(donation);

        // TODO: Implementar notificação para o recebedor

        return {
            message: 'Comprovante enviado com sucesso. Aguardando confirmação.',
        };
    }

    /**
     * Confirm donation receipt
     */
    async confirmDonation(
        donationId: string,
        userId: string,
    ): Promise<DonationConfirmResponseDto> {
        const donation = await this.donationsRepository.findOne({
            where: { id: donationId },
            relations: ['donor', 'receiver'],
        });

        if (!donation) {
            throw new NotFoundException('Doação não encontrada');
        }

        if (donation.receiver_id !== userId) {
            throw new ForbiddenException('Apenas o recebedor pode confirmar a doação');
        }

        if (donation.status !== DonationStatus.PENDING_CONFIRMATION) {
            throw new BadRequestException('Esta doação não está aguardando confirmação');
        }

        donation.status = DonationStatus.CONFIRMED;
        donation.completed_at = new Date();

        await this.donationsRepository.save(donation);

        // Trigger business rules for this donation type
        await this.donationsBusinessService.processDonationConfirmation(donation);

        // TODO: Implementar notificação para o doador

        return {
            message: 'Doação confirmada com sucesso!',
        };
    }

    /**
     * Get comprovante URL for viewing
     */
    async getComprovanteUrl(
        donationId: string,
        userId: string,
    ): Promise<ComprovanteUrlResponseDto> {
        const donation = await this.donationsRepository.findOne({
            where: { id: donationId },
        });

        if (!donation) {
            throw new NotFoundException('Doação não encontrada');
        }

        if (donation.donor_id !== userId && donation.receiver_id !== userId) {
            throw new ForbiddenException('Você não tem permissão para visualizar este comprovante');
        }

        if (!donation.comprovante_url) {
            throw new NotFoundException('Comprovante não encontrado');
        }

        // TODO: Gerar URL assinada temporária para o arquivo
        // Por enquanto, retornamos a URL direta
        return {
            comprovanteUrl: donation.comprovante_url,
        };
    }

    /**
     * Helper method to map User to UserPublicProfileDto
     */
    private mapUserToPublicProfile(user: User): UserPublicProfileDto {
        if (!user) {
            return {
                id: '',
                name: 'Usuário não encontrado',
                avatarUrl: undefined,
                pixKey: undefined,
            };
        }

        return {
            id: user.id || '',
            name: user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email || 'Nome não disponível',
            avatarUrl: user.email, // TODO: Implementar campo avatarUrl quando disponível
            pixKey: user.pixKey,
        };
    }

    /**
     * Create a new donation
     */
    async createDonation(
        donorId: string,
        receiverId: string,
        amount: number,
        type: DonationType,
        deadline?: Date,
    ): Promise<Donation> {
        const donation = this.donationsRepository.create({
            donor_id: donorId,
            receiver_id: receiverId,
            amount,
            type,
            status: DonationStatus.PENDING_PAYMENT,
            deadline,
        });

        return this.donationsRepository.save(donation);
    }

    /**
     * Find donation by ID
     */
    async findById(id: string): Promise<Donation> {
        const donation = await this.donationsRepository.findOne({
            where: { id },
            relations: ['donor', 'receiver'],
        });

        if (!donation) {
            throw new NotFoundException('Doação não encontrada');
        }

        return donation;
    }

    /**
     * Create donation with custom data (used for seeding)
     */
    async createDonationWithCustomData(data: {
        donor_id: string;
        receiver_id: string;
        amount: number;
        type: DonationType;
        status?: DonationStatus;
        deadline?: Date;
        comprovante_url?: string;
        completed_at?: Date;
        notes?: string;
        created_at?: Date;
    }): Promise<Donation> {
        const donation = this.donationsRepository.create(data);
        return this.donationsRepository.save(donation);
    }

    /**
     * Get all donations for admin with filters and pagination
     */
    async getAllDonationsForAdmin(
        filters: DonationAdminFiltersDto,
        page: number = 1,
        limit: number = 20,
    ): Promise<DonationAdminListDto> {
        const offset = (page - 1) * limit;

        const queryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .orderBy('donation.created_at', 'DESC');

        // Apply filters
        if (filters.status) {
            queryBuilder.andWhere('donation.status = :status', { status: filters.status });
        }

        if (filters.type) {
            queryBuilder.andWhere('donation.type = :type', { type: filters.type });
        }

        if (filters.donorId) {
            queryBuilder.andWhere('donation.donor_id = :donorId', { donorId: filters.donorId });
        }

        if (filters.receiverId) {
            queryBuilder.andWhere('donation.receiver_id = :receiverId', { receiverId: filters.receiverId });
        }

        if (filters.dateFrom) {
            queryBuilder.andWhere('donation.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
        }

        if (filters.dateTo) {
            queryBuilder.andWhere('donation.created_at <= :dateTo', { dateTo: filters.dateTo });
        }

        if (filters.minAmount) {
            queryBuilder.andWhere('donation.amount >= :minAmount', { minAmount: filters.minAmount });
        }

        if (filters.maxAmount) {
            queryBuilder.andWhere('donation.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }

        // Get total count for pagination
        const totalItems = await queryBuilder.getCount();

        // Apply pagination
        const donations = await queryBuilder
            .skip(offset)
            .take(limit)
            .getMany();

        // Get statistics
        const stats = await this.getAdminStats(filters);

        const data: DonationAdminItemDto[] = donations.map(donation => ({
            id: donation.id,
            amount: parseFloat(donation.amount.toString()),
            type: donation.type,
            status: donation.status,
            donor: this.mapUserToPublicProfile(donation.donor),
            receiver: this.mapUserToPublicProfile(donation.receiver),
            comprovante_url: donation.comprovante_url,
            deadline: donation.deadline,
            completed_at: donation.completed_at,
            notes: donation.notes,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
        }));

        const pagination = {
            currentPage: page,
            totalPages: Math.ceil(totalItems / limit),
            totalItems,
        };

        return { data, pagination, stats };
    }

    /**
     * Get general statistics for admin
     */
    async getAdminStats(filters?: DonationAdminFiltersDto): Promise<DonationAdminStatsDto> {
        const queryBuilder = this.donationsRepository.createQueryBuilder('donation');

        // Apply filters if provided
        if (filters) {
            if (filters.status) {
                queryBuilder.andWhere('donation.status = :status', { status: filters.status });
            }
            if (filters.type) {
                queryBuilder.andWhere('donation.type = :type', { type: filters.type });
            }
            if (filters.donorId) {
                queryBuilder.andWhere('donation.donor_id = :donorId', { donorId: filters.donorId });
            }
            if (filters.receiverId) {
                queryBuilder.andWhere('donation.receiver_id = :receiverId', { receiverId: filters.receiverId });
            }
            if (filters.dateFrom) {
                queryBuilder.andWhere('donation.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
            }
            if (filters.dateTo) {
                queryBuilder.andWhere('donation.created_at <= :dateTo', { dateTo: filters.dateTo });
            }
            if (filters.minAmount) {
                queryBuilder.andWhere('donation.amount >= :minAmount', { minAmount: filters.minAmount });
            }
            if (filters.maxAmount) {
                queryBuilder.andWhere('donation.amount <= :maxAmount', { maxAmount: filters.maxAmount });
            }
        }

        // Total donations and amount
        const totalStats = await queryBuilder
            .select('COUNT(*)', 'totalDonations')
            .addSelect('SUM(donation.amount)', 'totalAmount')
            .getRawOne();

        // Status counts
        const statusCounts = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('donation.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('donation.status')
            .getRawMany();

        // Users with donations count
        const usersWithDonations = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('COUNT(DISTINCT donor_id)', 'donorCount')
            .addSelect('COUNT(DISTINCT receiver_id)', 'receiverCount')
            .getRawOne();

        const totalUsersWithDonations = Math.max(
            parseInt(usersWithDonations.donorCount || '0'),
            parseInt(usersWithDonations.receiverCount || '0')
        );

        const statusMap = new Map(statusCounts.map(item => [item.status, parseInt(item.count)]));

        const averageDonationAmount = totalStats.totalAmount ?
            parseFloat(totalStats.totalAmount) / parseInt(totalStats.totalDonations) : 0;

        return {
            totalDonations: parseInt(totalStats.totalDonations || '0'),
            totalAmount: parseFloat(totalStats.totalAmount || '0'),
            pendingPayment: statusMap.get(DonationStatus.PENDING_PAYMENT) || 0,
            pendingConfirmation: statusMap.get(DonationStatus.PENDING_CONFIRMATION) || 0,
            confirmed: statusMap.get(DonationStatus.CONFIRMED) || 0,
            expired: statusMap.get(DonationStatus.EXPIRED) || 0,
            cancelled: statusMap.get(DonationStatus.CANCELLED) || 0,
            totalUsersWithDonations,
            averageDonationAmount: parseFloat(averageDonationAmount.toFixed(2)),
        };
    }

    /**
     * Get donation details for admin (including all fields)
     */
    async getDonationForAdmin(donationId: string): Promise<DonationAdminItemDto> {
        const donation = await this.donationsRepository.findOne({
            where: { id: donationId },
            relations: ['donor', 'receiver'],
        });

        if (!donation) {
            throw new NotFoundException('Doação não encontrada');
        }

        return {
            id: donation.id,
            amount: parseFloat(donation.amount.toString()),
            type: donation.type,
            status: donation.status,
            donor: this.mapUserToPublicProfile(donation.donor),
            receiver: this.mapUserToPublicProfile(donation.receiver),
            comprovante_url: donation.comprovante_url,
            deadline: donation.deadline,
            completed_at: donation.completed_at,
            notes: donation.notes,
            created_at: donation.created_at,
            updated_at: donation.updated_at,
        };
    }

    /**
     * Report that a donation was not received
     */
    async reportDonationNotReceived(
        donationId: string,
        userId: string,
        reportData: DonationReportDto,
    ): Promise<DonationReportResponseDto> {
        const donation = await this.findById(donationId);

        // Verificar se o usuário é o recebedor da doação
        if (donation.receiver_id !== userId) {
            throw new ForbiddenException('Você só pode reportar doações que deveria receber');
        }

        // Verificar se a doação já foi reportada
        if (donation.is_reported) {
            throw new BadRequestException('Esta doação já foi reportada');
        }

        // Verificar se a doação está em um status válido para reporte
        if (donation.status !== DonationStatus.PENDING_CONFIRMATION) {
            throw new BadRequestException(
                'Só é possível reportar doações que estão aguardando confirmação',
            );
        }

        // Atualizar a doação com os dados do reporte
        await this.donationsRepository.update(donationId, {
            is_reported: true,
            report_reason: reportData.reason,
            report_additional_info: reportData.additionalInfo,
            reported_at: new Date(),
        });

        return {
            message: 'Reporte enviado com sucesso. Nossa equipe analisará o caso.',
            donationId,
            reportedAt: new Date(),
        };
    }

    /**
     * Get all reported donations for admin
     */
    async getAdminReportedDonations(
        filters?: DonationReportAdminFiltersDto,
    ): Promise<DonationReportAdminListDto> {
        const page = filters?.page || 1;
        const limit = Math.min(filters?.limit || 20, 100);
        const skip = (page - 1) * limit;

        const queryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.is_reported = :isReported', { isReported: true })
            .orderBy('donation.reported_at', 'DESC');

        // Apply filters
        if (filters?.dateFrom) {
            try {
                const dateFrom = new Date(filters.dateFrom);
                if (!isNaN(dateFrom.getTime())) {
                    queryBuilder.andWhere('donation.reported_at >= :dateFrom', {
                        dateFrom,
                    });
                }
            } catch (error) {
                console.warn('Invalid dateFrom filter:', filters.dateFrom);
            }
        }

        if (filters?.dateTo) {
            try {
                const dateTo = new Date(filters.dateTo);
                if (!isNaN(dateTo.getTime())) {
                    queryBuilder.andWhere('donation.reported_at <= :dateTo', {
                        dateTo,
                    });
                }
            } catch (error) {
                console.warn('Invalid dateTo filter:', filters.dateTo);
            }
        }

        if (filters?.minAmount && !isNaN(filters.minAmount) && filters.minAmount > 0) {
            queryBuilder.andWhere('donation.amount >= :minAmount', {
                minAmount: filters.minAmount,
            });
        }

        if (filters?.maxAmount && !isNaN(filters.maxAmount) && filters.maxAmount > 0) {
            queryBuilder.andWhere('donation.amount <= :maxAmount', {
                maxAmount: filters.maxAmount,
            });
        }

        if (filters?.donorId) {
            queryBuilder.andWhere('donation.donor_id = :donorId', {
                donorId: filters.donorId,
            });
        }

        if (filters?.receiverId) {
            queryBuilder.andWhere('donation.receiver_id = :receiverId', {
                receiverId: filters.receiverId,
            });
        }

        if (filters?.type) {
            queryBuilder.andWhere('donation.type = :type', {
                type: filters.type,
            });
        }

        try {
            const [donations, total] = await queryBuilder
                .skip(skip)
                .take(limit)
                .getManyAndCount();

            const totalPages = Math.ceil(total / limit);

            return {
                data: donations.map((donation) => this.mapDonationToReportAdminItem(donation)),
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                },
            };
        } catch (error) {
            console.error('Error executing admin reports query:', error);
            throw new Error(`Erro ao buscar reports administrativos: ${error.message}`);
        }
    }

    /**
     * Get reported donation details for admin
     */
    async getAdminReportedDonationDetails(
        donationId: string,
    ): Promise<DonationReportAdminItemDto> {
        const donation = await this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.id = :donationId', { donationId })
            .andWhere('donation.is_reported = :isReported', { isReported: true })
            .getOne();

        if (!donation) {
            throw new NotFoundException('Reporte de doação não encontrado');
        }

        return this.mapDonationToReportAdminItem(donation);
    }

    /**
     * Get reported donations statistics for admin
     */
    async getAdminReportedDonationsStats(
        filters?: DonationReportAdminFiltersDto,
    ): Promise<DonationReportAdminStatsDto> {
        const queryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .where('donation.is_reported = :isReported', { isReported: true });

        // Apply same filters as list
        if (filters?.dateFrom) {
            queryBuilder.andWhere('donation.reported_at >= :dateFrom', {
                dateFrom: new Date(filters.dateFrom),
            });
        }

        if (filters?.dateTo) {
            queryBuilder.andWhere('donation.reported_at <= :dateTo', {
                dateTo: new Date(filters.dateTo),
            });
        }

        if (filters?.minAmount && !isNaN(filters.minAmount) && filters.minAmount > 0) {
            queryBuilder.andWhere('donation.amount >= :minAmount', {
                minAmount: filters.minAmount,
            });
        }

        if (filters?.maxAmount && !isNaN(filters.maxAmount) && filters.maxAmount > 0) {
            queryBuilder.andWhere('donation.amount <= :maxAmount', {
                maxAmount: filters.maxAmount,
            });
        }

        if (filters?.donorId) {
            queryBuilder.andWhere('donation.donor_id = :donorId', {
                donorId: filters.donorId,
            });
        }

        if (filters?.receiverId) {
            queryBuilder.andWhere('donation.receiver_id = :receiverId', {
                receiverId: filters.receiverId,
            });
        }

        if (filters?.type) {
            queryBuilder.andWhere('donation.type = :type', {
                type: filters.type,
            });
        }

        const [totalReports, totalAmount] = await Promise.all([
            queryBuilder.getCount(),
            queryBuilder
                .select('SUM(donation.amount)', 'total')
                .getRawOne()
                .then((result) => parseFloat(result.total) || 0),
        ]);

        // Get reports this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const reportsThisWeek = await queryBuilder
            .clone()
            .andWhere('donation.reported_at >= :oneWeekAgo', { oneWeekAgo })
            .getCount();

        // Get reports this month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const reportsThisMonth = await queryBuilder
            .clone()
            .andWhere('donation.reported_at >= :oneMonthAgo', { oneMonthAgo })
            .getCount();

        const averageReportAmount = totalReports > 0 ? totalAmount / totalReports : 0;

        return {
            totalReports,
            totalAmountReported: totalAmount,
            reportsThisWeek,
            reportsThisMonth,
            averageReportAmount,
        };
    }

    /**
     * Resolve a donation report (Admin only)
     */
    async resolveDonationReport(
        donationId: string,
        resolutionData: DonationReportResolutionDto,
    ): Promise<DonationReportResolutionResponseDto> {
        const donation = await this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.id = :donationId', { donationId })
            .andWhere('donation.is_reported = :isReported', { isReported: true })
            .getOne();

        if (!donation) {
            throw new NotFoundException('Reporte de doação não encontrado');
        }

        // Verificar se já foi resolvido
        if (donation.report_resolved) {
            throw new BadRequestException('Este reporte já foi resolvido');
        }

        // Atualizar a doação com a resolução
        await this.donationsRepository.update(donationId, {
            report_resolved: true,
            report_resolution: resolutionData.resolution,
            report_admin_notes: resolutionData.admin_notes,
            report_resolved_at: new Date(),
        });

        // TODO: Aqui você pode adicionar notificação para o usuário
        // Por exemplo: enviar email, push notification, etc.

        return {
            message: 'Reporte resolvido com sucesso',
            donationId,
            resolution: resolutionData.resolution,
            resolvedAt: new Date(),
        };
    }

    /**
     * Get user's own reported donations
     */
    async getUserReports(
        userId: string,
        filters?: DonationUserReportsFiltersDto,
    ): Promise<DonationUserReportsListDto> {
        const page = filters?.page || 1;
        const limit = Math.min(filters?.limit || 20, 100);
        const skip = (page - 1) * limit;

        const queryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.is_reported = :isReported', { isReported: true })
            .andWhere('donation.receiver_id = :receiverId', { receiverId: userId })
            .orderBy('donation.reported_at', 'DESC');

        // Apply filters
        if (filters?.resolved !== undefined) {
            queryBuilder.andWhere('donation.report_resolved = :resolved', {
                resolved: filters.resolved,
            });
        }

        const [donations, total] = await queryBuilder
            .skip(skip)
            .take(limit)
            .getManyAndCount();

        const totalPages = Math.ceil(total / limit);

        return {
            data: donations.map((donation) => this.mapDonationToUserReportItem(donation)),
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
            },
        };
    }

    /**
     * Get user's specific reported donation details
     */
    async getUserReportDetails(
        donationId: string,
        userId: string,
    ): Promise<DonationUserReportItemDto> {
        const donation = await this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.receiver', 'receiver')
            .where('donation.id = :donationId', { donationId })
            .andWhere('donation.is_reported = :isReported', { isReported: true })
            .andWhere('donation.receiver_id = :receiverId', { receiverId: userId })
            .getOne();

        if (!donation) {
            throw new NotFoundException('Reporte não encontrado ou você não tem permissão para visualizá-lo');
        }

        return this.mapDonationToUserReportItem(donation);
    }

    /**
     * Map donation to user report item (without admin notes)
     */
    private mapDonationToUserReportItem(donation: Donation): DonationUserReportItemDto {
        return {
            id: donation.id,
            amount: donation.amount,
            type: donation.type,
            status: donation.status,
            report_reason: donation.report_reason,
            report_additional_info: donation.report_additional_info,
            reported_at: donation.reported_at,
            report_resolved: donation.report_resolved,
            report_resolution: donation.report_resolution,
            report_resolution_message: donation.report_admin_notes, // This should be a separate field for user feedback
            report_resolved_at: donation.report_resolved_at,
            donor: this.mapUserToPublicProfile(donation.donor),
            receiver: this.mapUserToPublicProfile(donation.receiver),
            created_at: donation.created_at,
            deadline: donation.deadline,
        };
    }

    /**
     * Map donation to admin report item
     */
    private mapDonationToReportAdminItem(donation: Donation): DonationReportAdminItemDto {
        if (!donation) {
            throw new Error('Donation não pode ser null');
        }

        return {
            id: donation.id || '',
            amount: donation.amount || 0,
            type: donation.type || '',
            status: donation.status || '',
            is_reported: donation.is_reported || false,
            report_reason: donation.report_reason || undefined,
            report_additional_info: donation.report_additional_info || undefined,
            reported_at: donation.reported_at || undefined,
            report_resolved: donation.report_resolved || false,
            report_resolution: donation.report_resolution || undefined,
            report_admin_notes: donation.report_admin_notes || undefined,
            report_resolved_at: donation.report_resolved_at || undefined,
            donor: this.mapUserToPublicProfile(donation.donor),
            receiver: this.mapUserToPublicProfile(donation.receiver),
            created_at: donation.created_at || new Date(),
            deadline: donation.deadline || undefined,
            notes: donation.notes || undefined,
        };
    }
}
