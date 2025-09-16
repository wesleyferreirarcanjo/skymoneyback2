import { IsEmail, IsString, MinLength, IsDateString, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  cpf: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  cep: string;

  @IsString()
  address: string;

  @IsString()
  addressNumber: string;

  @IsString()
  bank: string;

  @IsString()
  agency: string;

  @IsString()
  account: string;

  @IsString()
  pixKeyType: string;

  @IsString()
  pixKey: string;

  @IsString()
  pixOwnerName: string;

  @IsString()
  pixCopyPaste: string;

  @IsOptional()
  @IsString()
  pixQrCode?: string;

  @IsOptional()
  @IsString()
  btcAddress?: string;

  @IsOptional()
  @IsString()
  btcQrCode?: string;

  @IsOptional()
  @IsString()
  usdtAddress?: string;

  @IsOptional()
  @IsString()
  usdtQrCode?: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  avatar: string;

}