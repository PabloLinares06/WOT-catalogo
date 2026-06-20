import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('reference') reference: string,
    @Body('isExtra') isExtraRaw?: string,
    @Body('index') indexRaw?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!reference) {
      throw new BadRequestException('La referencia del producto es obligatoria');
    }

    const isExtra = isExtraRaw === 'true' || isExtraRaw === '1';
    const index = indexRaw !== undefined ? parseInt(indexRaw, 10) : undefined;

    return this.uploadService.uploadProductImage(file as any, reference, isExtra, index);
  }
}
