import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Donation, DonationStatus, DonationType } from './entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { FileUploadService } from '../common/services/file-upload.service';
import { QueueService } from '../queue/queue.service';
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
        private queueService: QueueService,
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
        file?: any,
        comprovanteBase64?: string,
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

        // If previously stored as filesystem path, try to delete
        if (donation.comprovante_url && donation.comprovante_url.startsWith('/uploads/')) {
            await this.fileUploadService.deleteFile(donation.comprovante_url);
        }

        // Store comprovante as base64 (data URL). If file provided, convert to base64; if base64 provided, normalize and validate.
        let comprovanteUrl: string;
        if (comprovanteBase64) {
            // Accept either raw base64 or data URL
            const dataUrlMatch = comprovanteBase64.match(/^data:(.*?);base64,(.*)$/);
            let mimeType = 'image/png';
            let dataPart = comprovanteBase64;
            if (dataUrlMatch) {
                mimeType = dataUrlMatch[1];
                dataPart = dataUrlMatch[2];
            }

            // Validate mime and size
            const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowed.includes(mimeType)) {
                throw new BadRequestException('Tipo de arquivo não permitido. Apenas JPG e PNG são aceitos');
            }
            const buffer = Buffer.from(dataPart, 'base64');
            const maxSize = 5 * 1024 * 1024;
            if (buffer.length > maxSize) {
                throw new BadRequestException('Arquivo muito grande. Máximo 5MB permitido');
            }
            comprovanteUrl = `data:${mimeType};base64,${dataPart}`;
        } else if (file) {
            // Validate using existing rules
            const fakeFile = { mimetype: file.mimetype, size: file.size, originalname: file.originalname, buffer: file.buffer };
            // Reuse validation logic indirectly by creating data URL if mimetype allowed and size ok
            const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!allowed.includes(fakeFile.mimetype)) {
                throw new BadRequestException('Tipo de arquivo não permitido. Apenas JPG e PNG são aceitos');
            }
            const maxSize = 5 * 1024 * 1024;
            if (fakeFile.size > maxSize) {
                throw new BadRequestException('Arquivo muito grande. Máximo 5MB permitido');
            }
            const base64 = file.buffer.toString('base64');
            comprovanteUrl = `data:${file.mimetype};base64,${base64}`;
        } else {
            throw new BadRequestException('Comprovante é obrigatório');
        }

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

        // Update receiver progress (but don't create upgrades automatically)
        const level = this.getLevelByAmount(parseFloat(donation.amount.toString()));
        await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), level);

        // Check if level is completed
        const completed = await this.checkLevelCompletion(donation.receiver_id, level);

        // If level is completed, return upgrade information (don't create donations yet)
        if (completed) {
            const upgradeInfo = await this.getUpgradeInfo(donation.receiver_id, level);

            return {
                message: 'Doação confirmada com sucesso!',
                level_completed: true,
                completed_level: level,
                upgrade_available: upgradeInfo,
            } as any;
        }

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

        // Now `comprovante_url` stores a data URL (base64). Return directly.
        return {
            comprovanteUrl: donation.comprovante_url,
        };
    }

    /**
     * Process business rules after a donation is confirmed
     * Inlined from former DonationsBusinessService
     */
    async processDonationConfirmation(donation: Donation): Promise<void> {
        try {
            switch (donation.type) {
                case DonationType.PULL:
                    await this.processPullDonation(donation);
                    break;
                case DonationType.CASCADE_N1:
                    await this.processCascadeN1Donation(donation);
                    break;
                case DonationType.UPGRADE_N2:
                    await this.processUpgradeN2Donation(donation);
                    break;
                case DonationType.REINJECTION_N2:
                    await this.processReinjectionN2Donation(donation);
                    break;
                case DonationType.UPGRADE_N3:
                    await this.processUpgradeN3Donation(donation);
                    break;
                case DonationType.REINFORCEMENT_N3:
                    await this.processReinforcementN3Donation(donation);
                    break;
                case DonationType.ADM_N3:
                    await this.processAdmN3Donation(donation);
                    break;
                case DonationType.FINAL_PAYMENT_N3:
                    await this.processFinalPaymentN3Donation(donation);
                    break;
                default:
                    this.logger.warn(`Unknown donation type: ${donation.type}`);
            }
        } catch (error) {
            this.logger.error(`Error processing business rules for donation ${donation.id}:`, error);
        }
    }

    /**
     * Accept upgrade to next level (user decision)
     * This is the trigger that creates upgrade and cascade donations
     */
    async acceptUpgrade(userId: string, fromLevel: number, toLevel: number): Promise<{
        message: string;
        new_level: number;
        donations_created: any[];
    }> {
        this.logger.log(`User ${userId} accepting upgrade from level ${fromLevel} to ${toLevel}`);

        // 1. Verify user completed the previous level
        const completed = await this.checkLevelCompletion(userId, fromLevel);

        if (!completed) {
            throw new BadRequestException('Você ainda não completou este nível');
        }

        // 2. Verify user hasn't already upgraded
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (user.current_level >= toLevel) {
            throw new BadRequestException('Você já está neste nível ou superior');
        }

        // 3. Verify the upgrade path is valid
        if (toLevel !== fromLevel + 1) {
            throw new BadRequestException('Sequência de upgrade inválida');
        }

        // 4. Create upgrade and cascade donations
        const createdDonations = await this.processLevelUpgrade(userId, fromLevel);

        return {
            message: 'Upgrade realizado com sucesso!',
            new_level: toLevel,
            donations_created: createdDonations,
        };
    }

    /**
     * Get upgrade information for a completed level
     */
    private async getUpgradeInfo(userId: string, completedLevel: number): Promise<any> {
        const upgradeMap = {
            1: {
                to_level: 2,
                upgrade_amount: 200,
                cascade_amount: 100,
                total: 300,
                description: 'Upgrade para Nível 2 + Cascata N1',
            },
            2: {
                to_level: 3,
                upgrade_amount: 1600,
                reinjection_amount: 2000,
                total: 3600,
                description: 'Upgrade para Nível 3 + Reinjeção N2',
            },
            3: {
                can_reenter: true,
                message: 'Parabéns! Você completou todos os níveis!',
                total_earned: 32000,
            },
        };

        const info = upgradeMap[completedLevel];

        if (!info) {
            return null;
        }

        const queueEntries = await this.queueService.findByUserId(userId);
        const levelQueue = queueEntries.find(q => q.donation_number === completedLevel);

        return {
            can_upgrade: completedLevel < 3,
            from_level: completedLevel,
            to_level: info.to_level || null,
            requirements: info,
            user_balance: parseFloat(levelQueue?.total_received?.toString() || '0'),
            can_afford: true,
        };
    }

    // ===== BUSINESS RULE HANDLERS - SKYMONEY 2.0 =====

    /**
     * Process PULL donation (monthly contribution)
     */
    private async processPullDonation(donation: Donation): Promise<void> {
        this.logger.log(`Processing PULL donation: ${donation.id} - Amount: ${donation.amount}`);
        
        try {
            // 1. Determine level based on donation amount
            const level = this.getLevelByAmount(parseFloat(donation.amount.toString()));
            
            // 2. Update receiver progress
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), level);
            
            // 3. Check if level is completed
            const completed = await this.checkLevelCompletion(donation.receiver_id, level);
            
            if (completed) {
                // 4. Process upgrade to next level
                await this.processLevelUpgrade(donation.receiver_id, level);
            }
        } catch (error) {
            this.logger.error(`Error processing PULL donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process CASCADE_N1 donation (N1 cascade after user completes N1)
     */
    private async processCascadeN1Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing CASCADE_N1 donation: ${donation.id}`);
        
        try {
            // 1. Update receiver progress in N1
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 1);
            
            // 2. Check if completed N1
            const completed = await this.checkLevelCompletion(donation.receiver_id, 1);
            
            if (completed) {
                // 3. Create upgrade for N2 (R$ 200)
                await this.createUpgradeDonation(donation.receiver_id, 2, 200);
                
                // 4. Create cascade N1 (R$ 100) for next participant
                await this.createCascadeDonation(1, 100);
                
                // 5. Update user level
                await this.updateUserLevel(donation.receiver_id, 2);
            }
        } catch (error) {
            this.logger.error(`Error processing CASCADE_N1 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process UPGRADE_N2 donation (upgrade from N1 to N2)
     */
    private async processUpgradeN2Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing UPGRADE_N2 donation: ${donation.id}`);
        
        try {
            // 1. Ensure user is in N2 queue
            await this.ensureUserInQueue(donation.receiver_id, 2);
            
            // 2. Update receiver progress in N2
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 2);
        } catch (error) {
            this.logger.error(`Error processing UPGRADE_N2 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process REINJECTION_N2 donation (reinjection back to N2)
     */
    private async processReinjectionN2Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing REINJECTION_N2 donation: ${donation.id}`);
        
        try {
            // 1. Update receiver progress in N2
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 2);
            
            // 2. Check if completed N2
            const completed = await this.checkLevelCompletion(donation.receiver_id, 2);
            
            if (completed) {
                // 3. Create upgrade for N3 (R$ 1.600)
                await this.createUpgradeDonation(donation.receiver_id, 3, 1600);
                
                // 4. Create reinjection N2 (R$ 2.000 = 10 donations of R$ 200)
                await this.createReinjectionDonations(2, 2000);
                
                // 5. Check and trigger package 8k (every 5 upgrades)
                await this.checkAndTriggerPackage8k();
                
                // 6. Update user level
                await this.updateUserLevel(donation.receiver_id, 3);
            }
        } catch (error) {
            this.logger.error(`Error processing REINJECTION_N2 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process UPGRADE_N3 donation (upgrade from N2 to N3)
     */
    private async processUpgradeN3Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing UPGRADE_N3 donation: ${donation.id}`);
        
        try {
            // 1. Ensure user is in N3 queue
            await this.ensureUserInQueue(donation.receiver_id, 3);
            
            // 2. Update receiver progress in N3
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 3);
        } catch (error) {
            this.logger.error(`Error processing UPGRADE_N3 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process REINFORCEMENT_N3 donation (N3 reinforcement - goes to N2 or cascades in N3)
     */
    private async processReinforcementN3Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing REINFORCEMENT_N3 donation: ${donation.id}`);
        
        try {
            // 1. Check if N2 is still active
            const n2Active = await this.isLevelActive(2);
            
            if (n2Active) {
                // 2. Reinject to N2
                await this.createReinjectionDonations(2, parseFloat(donation.amount.toString()));
                this.logger.log(`Reinforcement sent to N2: ${donation.amount}`);
            } else {
                // 3. Use as final cascade N3
                await this.createCascadeDonation(3, parseFloat(donation.amount.toString()));
                this.logger.log(`Reinforcement used as N3 cascade: ${donation.amount}`);
            }
            
            // 4. Update receiver progress (counts towards N3 completion)
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 3);
        } catch (error) {
            this.logger.error(`Error processing REINFORCEMENT_N3 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process ADM_N3 donation (administrative donation - first 2 of N3)
     */
    private async processAdmN3Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing ADM_N3 donation: ${donation.id}`);
        
        try {
            // Admin donations don't affect user progress
            // Just log for administrative reports
            this.logger.log(`Admin donation logged: ${donation.amount} from ${donation.donor_id}`);
        } catch (error) {
            this.logger.error(`Error processing ADM_N3 donation ${donation.id}:`, error);
            throw error;
        }
    }

    /**
     * Process FINAL_PAYMENT_N3 donation (final payments - donations 8-27 of N3)
     */
    private async processFinalPaymentN3Donation(donation: Donation): Promise<void> {
        this.logger.log(`Processing FINAL_PAYMENT_N3 donation: ${donation.id}`);
        
        try {
            // 1. Update receiver progress in N3
            await this.updateReceiverProgress(donation.receiver_id, parseFloat(donation.amount.toString()), 3);
            
            // 2. Check if completed N3
            const completed = await this.checkLevelCompletion(donation.receiver_id, 3);
            
            if (completed) {
                // 3. Mark user as eligible for reentry
                await this.markUserForReentry(donation.receiver_id);
                
                // 4. Create final cascade N3 (R$ 8.000)
                await this.createCascadeDonation(3, 8000);
                
                this.logger.log(`User ${donation.receiver_id} completed N3! R$ 32.000 earned.`);
            }
        } catch (error) {
            this.logger.error(`Error processing FINAL_PAYMENT_N3 donation ${donation.id}:`, error);
            throw error;
        }
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

    /**
     * Generate initial pending donations for a 100-user queue following the pattern:
     * #1 receives from #2,#3,#4; #2 from #5,#6,#7; ...; #33 from #98,#99,#100
     * Only executes when exactly 100 users are present for the given donationNumber.
     */
    async generateCycleDonations(
        donationNumber: number,
        donorsCount: number,
        amount: number,
        type?: DonationType,
        deadlineDays?: number,
    ): Promise<{ createdCount: number; skippedExisting: number; receiversProcessed: number }> {
        const queue = await this.queueService.findByDonationNumber(donationNumber);
        if (queue.length !== 100) {
            throw new BadRequestException('Queue must have exactly 100 users to start the cycle');
        }

        const ordered = [...queue].sort((a, b) => a.position - b.position);
        const minPosition = ordered[0]?.position ?? 1;
        const isZeroBased = minPosition === 0;

        let createdCount = 0;
        let skippedExisting = 0;
        let receiversProcessed = 0;

        // Fixed mapping per spec: receivers 1..33, donors are 3*r-1, 3*r, 3*r+1
        const maxReceivers = 33;
        const receiverStart = isZeroBased ? 0 : 1;
        const receiverEnd = isZeroBased ? 32 : 33;
        for (let r = receiverStart; r <= receiverEnd; r++) {
            const receiverEntry = ordered.find(q => q.position === r);
            if (!receiverEntry || !receiverEntry.user_id) continue;
            const receiverId = receiverEntry.user_id;

            const donorsPositions = isZeroBased
                ? [3 * r + 1, 3 * r + 2, 3 * r + 3]
                : [3 * r - 1, 3 * r, 3 * r + 1];
            for (const pos of donorsPositions) {
                const donorEntry = ordered.find(q => q.position === pos);
                if (!donorEntry || !donorEntry.user_id) continue;

                // Idempotency: skip if a pending/awaiting donation already exists
                const existing = await this.donationsRepository.findOne({
                    where: [
                        { donor_id: donorEntry.user_id, receiver_id: receiverId, status: DonationStatus.PENDING_PAYMENT },
                        { donor_id: donorEntry.user_id, receiver_id: receiverId, status: DonationStatus.PENDING_CONFIRMATION },
                    ],
                });
                if (existing) {
                    skippedExisting++;
                    continue;
                }

                const deadline = deadlineDays ? new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000) : undefined;
                const donation = this.donationsRepository.create({
                    donor_id: donorEntry.user_id,
                    receiver_id: receiverId,
                    amount,
                    type: type || DonationType.PULL,
                    status: DonationStatus.PENDING_PAYMENT,
                    deadline,
                });
                await this.donationsRepository.save(donation);
                createdCount++;
            }

            receiversProcessed++;
        }

        return { createdCount, skippedExisting, receiversProcessed };
    }

    // ===== AUXILIARY METHODS FOR SKYMONEY 2.0 LOGIC =====

    /**
     * Get level based on donation amount
     */
    private getLevelByAmount(amount: number): number {
        if (amount === 100) return 1;
        if (amount === 200) return 2;
        if (amount === 1600) return 3;
        
        this.logger.warn(`Unknown amount for level determination: ${amount}, defaulting to level 1`);
        return 1;
    }

    /**
     * Get required donations for level
     */
    private getRequiredDonationsForLevel(level: number): number {
        switch (level) {
            case 1: return 3;
            case 2: return 18;
            case 3: return 27;
            default: throw new BadRequestException(`Unknown level: ${level}`);
        }
    }

    /**
     * Update receiver progress in a specific level
     */
    private async updateReceiverProgress(userId: string, amount: number, level: number): Promise<void> {
        const queueEntries = await this.queueService.findByUserId(userId);
        const levelQueue = queueEntries.find(q => q.donation_number === level);
        
        if (!levelQueue) {
            this.logger.warn(`User ${userId} not found in level ${level} queue, skipping progress update`);
            return;
        }
        
        // Update progress
        const newDonationsReceived = (levelQueue.donations_received || 0) + 1;
        const newTotalReceived = parseFloat(levelQueue.total_received?.toString() || '0') + amount;
        
        await this.dataSource.query(
            `UPDATE queue SET donations_received = $1, total_received = $2, updated_at = NOW() WHERE id = $3`,
            [newDonationsReceived, newTotalReceived, levelQueue.id]
        );
        
        this.logger.log(`Updated progress for user ${userId} in level ${level}: ${newDonationsReceived}/${this.getRequiredDonationsForLevel(level)} donations`);
    }

    /**
     * Check if user completed a level
     */
    private async checkLevelCompletion(userId: string, level: number): Promise<boolean> {
        const queueEntries = await this.queueService.findByUserId(userId);
        const levelQueue = queueEntries.find(q => q.donation_number === level);
        
        if (!levelQueue) return false;
        
        const requiredDonations = this.getRequiredDonationsForLevel(level);
        const donationsReceived = levelQueue.donations_received || 0;
        
        const isCompleted = donationsReceived >= requiredDonations;
        
        if (isCompleted && !levelQueue.level_completed) {
            // Mark level as completed
            await this.dataSource.query(
                `UPDATE queue SET level_completed = true, level_completed_at = NOW() WHERE id = $1`,
                [levelQueue.id]
            );
            this.logger.log(`User ${userId} completed level ${level}!`);
        }
        
        return isCompleted;
    }

    /**
     * Process level upgrade (create upgrade donation and cascade)
     * Returns the donations created
     */
    private async processLevelUpgrade(userId: string, completedLevel: number): Promise<any[]> {
        this.logger.log(`Processing level upgrade for user ${userId} from level ${completedLevel}`);
        
        const createdDonations = [];
        
        switch (completedLevel) {
            case 1:
                // Create upgrade to N2 (R$ 200)
                await this.createUpgradeDonation(userId, 2, 200);
                createdDonations.push({ type: 'upgrade', level: 2, amount: 200 });
                
                // Create cascade N1 (R$ 100)
                await this.createCascadeDonation(1, 100);
                createdDonations.push({ type: 'cascade', level: 1, amount: 100 });
                
                // Update user level
                await this.updateUserLevel(userId, 2);
                break;
                
            case 2:
                // Create upgrade to N3 (R$ 1.600)
                await this.createUpgradeDonation(userId, 3, 1600);
                createdDonations.push({ type: 'upgrade', level: 3, amount: 1600 });
                
                // Create reinjection N2 (R$ 2.000)
                await this.createReinjectionDonations(2, 2000);
                createdDonations.push({ type: 'reinjection', level: 2, amount: 2000 });
                
                // Check package 8k
                await this.checkAndTriggerPackage8k();
                
                // Update user level
                await this.updateUserLevel(userId, 3);
                break;
                
            case 3:
                // Mark user for reentry
                await this.markUserForReentry(userId);
                createdDonations.push({ type: 'reentry_enabled', level: 3 });
                
                // Create final cascade
                await this.createCascadeDonation(3, 8000);
                createdDonations.push({ type: 'final_cascade', level: 3, amount: 8000 });
                break;
                
            default:
                this.logger.warn(`Unknown level for upgrade: ${completedLevel}`);
        }
        
        return createdDonations;
    }

    /**
     * Create upgrade donation to next level
     */
    private async createUpgradeDonation(userId: string, targetLevel: number, amount: number): Promise<void> {
        const nextReceiver = await this.getNextReceiverInLevel(targetLevel);
        
        if (!nextReceiver) {
            this.logger.warn(`No receiver found for level ${targetLevel} upgrade, creating for user ${userId}`);
            // If no receiver, user becomes the first in that level
            await this.ensureUserInQueue(userId, targetLevel);
            return;
        }
        
        const donationType = this.getUpgradeDonationType(targetLevel);
        
        await this.createDonation(
            userId,
            nextReceiver.user_id || userId,
            amount,
            donationType
        );
        
        this.logger.log(`Created upgrade donation: ${amount} to level ${targetLevel} for user ${userId}`);
    }

    /**
     * Create cascade donation
     */
    private async createCascadeDonation(level: number, amount: number): Promise<void> {
        const nextReceiver = await this.getNextReceiverInLevel(level);
        
        if (!nextReceiver) {
            this.logger.warn(`No receiver found for level ${level} cascade`);
            return;
        }
        
        const cascadeType = level === 1 ? DonationType.CASCADE_N1 : DonationType.PULL;
        
        // System donation (no specific donor)
        const systemUser = await this.usersRepository.findOne({ where: { role: UserRole.ADMIN } });
        
        await this.createDonation(
            systemUser?.id || nextReceiver.user_id,
            nextReceiver.user_id,
            amount,
            cascadeType
        );
        
        this.logger.log(`Created cascade donation: ${amount} for level ${level}`);
    }

    /**
     * Create reinjection donations
     */
    private async createReinjectionDonations(level: number, totalAmount: number): Promise<void> {
        const donationAmount = level === 2 ? 200 : 1600;
        const numberOfDonations = Math.floor(totalAmount / donationAmount);
        
        this.logger.log(`Creating ${numberOfDonations} reinjection donations of ${donationAmount} for level ${level}`);
        
        // System donation
        const systemUser = await this.usersRepository.findOne({ where: { role: UserRole.ADMIN } });
        
        for (let i = 0; i < numberOfDonations; i++) {
            const nextReceiver = await this.getNextReceiverInLevel(level);
            
            if (!nextReceiver) {
                this.logger.warn(`No receiver found for level ${level} reinjection ${i + 1}`);
                break;
            }
            
            await this.createDonation(
                systemUser?.id || nextReceiver.user_id,
                nextReceiver.user_id,
                donationAmount,
                DonationType.REINJECTION_N2
            );
        }
        
        this.logger.log(`Created ${numberOfDonations} reinjection donations for level ${level}`);
    }

    /**
     * Ensure user is in queue for a specific level
     */
    private async ensureUserInQueue(userId: string, level: number): Promise<void> {
        const existingQueues = await this.queueService.findByUserId(userId);
        const alreadyInLevel = existingQueues.some(q => q.donation_number === level);
        
        if (!alreadyInLevel) {
            const nextPosition = await this.getNextAvailablePosition(level);
            
            await this.dataSource.query(
                `INSERT INTO queue (user_id, donation_number, position, level, donations_required, is_receiver, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, false, NOW(), NOW())`,
                [userId, level, nextPosition, level, this.getRequiredDonationsForLevel(level)]
            );
            
            this.logger.log(`Added user ${userId} to level ${level} queue at position ${nextPosition}`);
        }
    }

    /**
     * Get next receiver in level queue
     */
    private async getNextReceiverInLevel(level: number): Promise<any> {
        const queues = await this.queueService.findByDonationNumber(level);
        const sortedQueues = queues
            .filter(q => q.user_id && !q.level_completed)
            .sort((a, b) => a.position - b.position);
        
        return sortedQueues[0] || null;
    }

    /**
     * Get next available position in level
     */
    private async getNextAvailablePosition(level: number): Promise<number> {
        const queues = await this.queueService.findByDonationNumber(level);
        const maxPosition = queues.length > 0 ? Math.max(...queues.map(q => q.position)) : 0;
        return maxPosition + 1;
    }

    /**
     * Get upgrade donation type for target level
     */
    private getUpgradeDonationType(level: number): DonationType {
        switch (level) {
            case 2: return DonationType.UPGRADE_N2;
            case 3: return DonationType.UPGRADE_N3;
            default: throw new BadRequestException(`Unknown upgrade level: ${level}`);
        }
    }

    /**
     * Update user level
     */
    private async updateUserLevel(userId: string, newLevel: number): Promise<void> {
        await this.usersRepository.update(userId, {
            current_level: newLevel
        });
        
        this.logger.log(`Updated user ${userId} to level ${newLevel}`);
    }

    /**
     * Mark user for reentry after completing N3
     */
    private async markUserForReentry(userId: string): Promise<void> {
        await this.usersRepository.update(userId, {
            can_reenter: true,
            n3_completed_at: new Date()
        });
        
        this.logger.log(`Marked user ${userId} for reentry - N3 completed!`);
    }

    /**
     * Check and trigger package 8k (every 5 upgrades to N3)
     */
    private async checkAndTriggerPackage8k(): Promise<void> {
        // Count recent upgrades to N3 in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const recentUpgrades = await this.donationsRepository.count({
            where: {
                type: DonationType.UPGRADE_N3,
                status: DonationStatus.CONFIRMED,
                completed_at: oneDayAgo as any // TypeORM MoreThan equivalent
            }
        });
        
        // Trigger package 8k every 5 upgrades
        if (recentUpgrades > 0 && recentUpgrades % 5 === 0) {
            await this.createReinjectionDonations(2, 8000);
            this.logger.log(`🎉 Triggered package 8k after ${recentUpgrades} upgrades!`);
        }
    }

    /**
     * Check if level is still active (has users who haven't completed it)
     */
    private async isLevelActive(level: number): Promise<boolean> {
        const activeUsers = await this.queueService.findByDonationNumber(level);
        return activeUsers.some(q => q.user_id && !q.level_completed);
    }

    // ===== PUBLIC METHODS FOR SKYMONEY 2.0 =====

    /**
     * Generate monthly PULL donations for all active levels
     */
    async generateMonthlyPull(): Promise<{ 
        message: string; 
        created: number; 
        errors: string[];
        breakdown: {
            n1: number;
            n2: number;
            n3: number;
        }
    }> {
        const errors: string[] = [];
        const breakdown = { n1: 0, n2: 0, n3: 0 };
        
        this.logger.log('Starting monthly PULL generation...');
        
        try {
            // N1: R$ 10.000 = 100 donations of R$ 100
            try {
                const n1Result = await this.generatePullForLevel(1, 100, 100);
                breakdown.n1 = n1Result;
                this.logger.log(`N1: Generated ${n1Result} PULL donations`);
            } catch (error) {
                errors.push(`N1 Error: ${error.message}`);
                this.logger.error('Error generating N1 PULL:', error);
            }
            
            // N2: R$ 10.000 = 50 donations of R$ 200
            try {
                const n2Result = await this.generatePullForLevel(2, 200, 50);
                breakdown.n2 = n2Result;
                this.logger.log(`N2: Generated ${n2Result} PULL donations`);
            } catch (error) {
                errors.push(`N2 Error: ${error.message}`);
                this.logger.error('Error generating N2 PULL:', error);
            }
            
            // N3: R$ 10.000 = 6 donations of R$ 1.600 (only if N2 is completed)
            const n2Active = await this.isLevelActive(2);
            if (!n2Active) {
                try {
                    const n3Result = await this.generatePullForLevel(3, 1600, 6);
                    breakdown.n3 = n3Result;
                    this.logger.log(`N3: Generated ${n3Result} PULL donations`);
                } catch (error) {
                    errors.push(`N3 Error: ${error.message}`);
                    this.logger.error('Error generating N3 PULL:', error);
                }
            } else {
                this.logger.log('N3: Skipped (N2 still active)');
            }
            
            const totalCreated = breakdown.n1 + breakdown.n2 + breakdown.n3;
            
            return {
                message: `Monthly PULL generated successfully. Total: ${totalCreated} donations`,
                created: totalCreated,
                errors,
                breakdown
            };
            
        } catch (error) {
            errors.push(`General Error: ${error.message}`);
            this.logger.error('Error generating monthly PULL:', error);
            throw error;
        }
    }

    /**
     * Generate PULL donations for a specific level
     */
    private async generatePullForLevel(level: number, amount: number, count: number): Promise<number> {
        let created = 0;
        const systemUser = await this.usersRepository.findOne({ where: { role: UserRole.ADMIN } });
        
        for (let i = 0; i < count; i++) {
            try {
                const nextReceiver = await this.getNextReceiverInLevel(level);
                
                if (!nextReceiver || !nextReceiver.user_id) {
                    this.logger.warn(`No receiver found for level ${level} PULL ${i + 1}`);
                    continue;
                }
                
                // Create PULL donation
                await this.createDonation(
                    systemUser?.id || nextReceiver.user_id,
                    nextReceiver.user_id,
                    amount,
                    DonationType.PULL
                );
                
                created++;
                
            } catch (error) {
                this.logger.error(`Error creating PULL donation ${i + 1} for level ${level}:`, error);
            }
        }
        
        return created;
    }

    /**
     * Get level statistics
     */
    async getLevelStats(level: number): Promise<{
        level: number;
        totalUsers: number;
        activeUsers: number;
        completedUsers: number;
        averageProgress: number;
        totalDonationsReceived: number;
        totalAmountReceived: number;
    }> {
        const queues = await this.queueService.findByDonationNumber(level);
        
        const totalUsers = queues.filter(q => q.user_id).length;
        const activeUsers = queues.filter(q => q.user_id && !q.level_completed).length;
        const completedUsers = queues.filter(q => q.user_id && q.level_completed).length;
        
        const requiredDonations = this.getRequiredDonationsForLevel(level);
        const totalProgress = queues.reduce((sum, q) => {
            if (!q.user_id) return sum;
            const progress = ((q.donations_received || 0) / requiredDonations) * 100;
            return sum + progress;
        }, 0);
        
        const averageProgress = totalUsers > 0 ? totalProgress / totalUsers : 0;
        
        const totalDonationsReceived = queues.reduce((sum, q) => sum + (q.donations_received || 0), 0);
        const totalAmountReceived = queues.reduce((sum, q) => sum + parseFloat(q.total_received?.toString() || '0'), 0);
        
        return {
            level,
            totalUsers,
            activeUsers,
            completedUsers,
            averageProgress: Math.round(averageProgress * 100) / 100,
            totalDonationsReceived,
            totalAmountReceived
        };
    }

    /**
     * Get user progress in all levels
     */
    async getUserLevelProgress(userId: string): Promise<Array<{
        level: number;
        donations_received: number;
        donations_required: number;
        total_received: number;
        progress_percentage: number;
        level_completed: boolean;
        level_completed_at?: Date;
    }>> {
        const queues = await this.queueService.findByUserId(userId);
        
        return queues.map(queue => {
            const donationsReceived = queue.donations_received || 0;
            const donationsRequired = queue.donations_required || this.getRequiredDonationsForLevel(queue.level || 1);
            const progressPercentage = (donationsReceived / donationsRequired) * 100;
            
            return {
                level: queue.level || queue.donation_number,
                donations_received: donationsReceived,
                donations_required: donationsRequired,
                total_received: parseFloat(queue.total_received?.toString() || '0'),
                progress_percentage: Math.round(progressPercentage * 100) / 100,
                level_completed: queue.level_completed || false,
                level_completed_at: queue.level_completed_at
            };
        }).sort((a, b) => a.level - b.level);
    }
}
