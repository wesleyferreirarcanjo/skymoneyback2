import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export enum UserStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    ACTIVE_PARTICIPANT = 'ACTIVE_PARTICIPANT',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    APPROVED = 'APPROVED',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    firstName: string;

    @Column({ type: 'varchar', length: 255 })
    lastName: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 20 })
    phone: string;

    @Column({ type: 'text', nullable: true })
    avatar?: string;

    @Column({ type: 'varchar', length: 255 })
    @Exclude()
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    pixKey?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    cpf?: string;

    @Column({ type: 'date', nullable: true })
    birthDate?: Date;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: UserStatus,
        default: UserStatus.PENDING,
    })
    status: UserStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: 'varchar', length: 10, nullable: true })
    cep?: string;

    @Column({ type: 'text', nullable: true })
    address?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    addressNumber?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    bank?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    agency?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    account?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    pixKeyType?: string;

    @Column({ type: 'text', nullable: true })
    pixCopyPaste?: string;

    @Column({ type: 'text', nullable: true })
    pixQrCode?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    btcAddress?: string;

    @Column({ type: 'text', nullable: true })
    btcQrCode?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    usdtAddress?: string;

    @Column({ type: 'text', nullable: true })
    usdtQrCode?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    pixOwnerName?: string;

    @Column({ type: 'boolean', default: false })
    adminApproved: boolean;

    @Column({ type: 'timestamp', nullable: true })
    adminApprovedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    adminApprovedBy?: string;

}