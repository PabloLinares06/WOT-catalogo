import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty({ message: 'La URL de escritorio es obligatoria' })
  desktopUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'La URL móvil es obligatoria' })
  mobileUrl: string;
}
