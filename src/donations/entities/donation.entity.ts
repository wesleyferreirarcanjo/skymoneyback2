import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DonationType {
    PULL = 'PULL',
    CASCADE_N1 = 'CASCADE_N1',
    UPGRADE_N2 = 'UPGRADE_N2',
    REINJECTION_N2 = 'REINJECTION_N2',
    UPGRADE_N3 = 'UPGRADE_N3',
    REINFORCEMENT_N3 = 'REINFORCEMENT_N3',
    ADM_N3 = 'ADM_N3',
    FINAL_PAYMENT_N3 = 'FINAL_PAYMENT_N3',
}

export enum DonationStatus {
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
    CONFIRMED = 'CONFIRMED',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

@Entity('donations')
@Index(['donor_id', 'status'])
@Index(['receiver_id', 'status'])
@Index(['status', 'created_at'])
export class Donation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: DonationType,
    })
    type: DonationType;

    @Column({
        type: 'enum',
        enum: DonationStatus,
        default: DonationStatus.PENDING_PAYMENT,
    })
    status: DonationStatus;

    @Column({ type: 'uuid', name: 'donor_id' })
    donor_id: string;

    @Column({ type: 'uuid', name: 'receiver_id' })
    receiver_id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'donor_id' })
    donor: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'receiver_id' })
    receiver: User;

    @Column({ type: 'text', nullable: true })
    comprovante_url?: string;

    @Column({ type: 'timestamptz', nullable: true })
    deadline?: Date;

    @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
    completed_at?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: false })
    is_reported: boolean;

    @Column({ type: 'text', nullable: true })
    report_reason?: string;

    @Column({ type: 'text', nullable: true })
    report_additional_info?: string;

    @Column({ type: 'timestamptz', nullable: true })
    reported_at?: Date;

    @Column({ type: 'boolean', default: false })
    report_resolved: boolean;

    @Column({ type: 'text', nullable: true })
    report_resolution?: string;

    @Column({ type: 'text', nullable: true })
    report_admin_notes?: string;

    @Column({ type: 'timestamptz', nullable: true })
    report_resolved_at?: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
