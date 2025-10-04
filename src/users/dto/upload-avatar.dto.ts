import { IsString, IsNotEmpty } from 'class-validator';

export class UploadAvatarDto {
  @IsString()
  @IsNotEmpty()
  avatar: string; // Base64 encoded image
}


