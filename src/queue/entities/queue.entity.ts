import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('queue')
export class Queue {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'integer', nullable: false })
    position: number;

    @Column({ type: 'integer', nullable: false, default: 0, comment: 'Number of donations received (count)' })
    donation_number: number;

    @Column({ type: 'boolean', nullable: false, default: false })
    is_receiver: boolean;

    @Column({ type: 'uuid', array: true, nullable: true })
    passed_user_ids: string[];

    @Column({ type: 'uuid', nullable: true })
    user_id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // SkyMoney 2.0 fields
    @Column({ type: 'int', default: 1, comment: 'Level (1, 2, or 3)' })
    level: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: 'Total amount received in this level' })
    total_received: number;

    @Column({ type: 'int', default: 0, comment: 'Number of donations received in this level' })
    donations_received: number;

    @Column({ type: 'int', default: 0, comment: 'Number of donations required to complete level' })
    donations_required: number;

    @Column({ type: 'boolean', default: false, comment: 'Whether level is completed' })
    level_completed: boolean;

    @Column({ type: 'timestamptz', nullable: true, comment: 'When level was completed' })
    level_completed_at: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
