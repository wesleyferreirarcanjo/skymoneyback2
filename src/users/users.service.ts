import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileUploadService } from '../common/services/file-upload.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { phone: createUserDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Only include properties that exist in the User entity
    const userData = {
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      phone: createUserDto.phone,
      password: hashedPassword,
      pixKey: createUserDto.pixKey,
      cpf: createUserDto.cpf,
      birthDate: createUserDto.birthDate,
      role: createUserDto.role,
      status: createUserDto.status,
      cep: createUserDto.cep,
      address: createUserDto.address,
      addressNumber: createUserDto.addressNumber,
      bank: createUserDto.bank,
      agency: createUserDto.agency,
      account: createUserDto.account,
      pixKeyType: createUserDto.pixKeyType,
      pixCopyPaste: createUserDto.pixCopyPaste,
      pixQrCode: createUserDto.pixQrCode,
      btcAddress: createUserDto.btcAddress,
      btcQrCode: createUserDto.btcQrCode,
      usdtAddress: createUserDto.usdtAddress,
      usdtQrCode: createUserDto.usdtQrCode,
      pixOwnerName: createUserDto.pixOwnerName,
      avatar: createUserDto.avatar,
      adminApproved: createUserDto.adminApproved,
      adminApprovedAt: createUserDto.adminApprovedAt,
      adminApprovedBy: createUserDto.adminApprovedBy,
    };

    const user = this.usersRepository.create(userData);

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Hash password if provided
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }


  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async approveUser(id: string, adminId: string): Promise<User> {
    const user = await this.findOne(id);
    user.adminApproved = true;
    user.adminApprovedAt = new Date();
    user.adminApprovedBy = adminId;
    user.status = UserStatus.APPROVED;
    return this.usersRepository.save(user);
  }

async createWithHashedPassword(userData: Omit<CreateUserDto, 'password'> & { password: string }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: userData.email },
        { phone: userData.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Only include properties that exist in the User entity
    const userEntityData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      pixKey: userData.pixKey,
      cpf: userData.cpf,
      birthDate: userData.birthDate,
      role: userData.role,
      status: userData.status,
      cep: userData.cep,
      address: userData.address,
      addressNumber: userData.addressNumber,
      bank: userData.bank,
      agency: userData.agency,
      account: userData.account,
      pixKeyType: userData.pixKeyType,
      pixCopyPaste: userData.pixCopyPaste,
      pixQrCode: userData.pixQrCode,
      btcAddress: userData.btcAddress,
      btcQrCode: userData.btcQrCode,
      usdtAddress: userData.usdtAddress,
      usdtQrCode: userData.usdtQrCode,
      pixOwnerName: userData.pixOwnerName,
      adminApproved: userData.adminApproved,
      adminApprovedAt: userData.adminApprovedAt,
      adminApprovedBy: userData.adminApprovedBy,
    };

    const user = this.usersRepository.create(userEntityData);
    return this.usersRepository.save(user);
  }

  async updateAvatar(id: string, base64Image: string): Promise<User> {
    const user = await this.findOne(id);
    
    // Delete old avatar if exists
    if (user.avatar) {
      await this.fileUploadService.deleteFile(user.avatar);
    }

    // Upload new avatar
    const avatarUrl = await this.fileUploadService.uploadAvatarBase64(base64Image);
    user.avatar = avatarUrl;
    
    return this.usersRepository.save(user);
  }

  async updateAvatarFile(id: string, file: any): Promise<User> {
    const user = await this.findOne(id);
    
    // Delete old avatar if exists
    if (user.avatar) {
      await this.fileUploadService.deleteFile(user.avatar);
    }

    // Upload new avatar
    const avatarUrl = await this.fileUploadService.uploadAvatar(file);
    user.avatar = avatarUrl;
    
    return this.usersRepository.save(user);
  }
}