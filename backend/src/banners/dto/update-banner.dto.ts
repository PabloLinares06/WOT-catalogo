import { IsString, IsOptional } from 'class-validator';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  desktopUrl?: string;

  @IsOptional()
  @IsString()
  mobileUrl?: string;
}
