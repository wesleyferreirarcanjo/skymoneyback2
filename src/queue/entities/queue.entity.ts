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

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
