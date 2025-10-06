import { UserRole, UserStatus } from '../../users/entities/user.entity';

export class UserCompleteDto {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar?: string;
    pixKey?: string;
    cpf?: string;
    birthDate?: Date;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    cep?: string;
    address?: string;
    addressNumber?: string;
    bank?: string;
    agency?: string;
    account?: string;
    pixKeyType?: string;
    pixCopyPaste?: string;
    pixQrCode?: string;
    btcAddress?: string;
    btcQrCode?: string;
    usdtAddress?: string;
    usdtQrCode?: string;
    pixOwnerName?: string;
    adminApproved: boolean;
    adminApprovedAt?: Date;
    adminApprovedBy?: string;
}
