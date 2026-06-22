import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT');
    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY');
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET');
    this.bucket = this.configService.get<string>('DO_SPACES_BUCKET');
    this.cdnUrl = this.configService.get<string>('DO_SPACES_CDN_URL');

    // Extract region from endpoint (e.g. https://nyc3.digitaloceanspaces.com -> nyc3)
    let region = 'us-east-1';
    if (endpoint) {
      const match = endpoint.match(/https?:\/\/([^.]+)\.digitaloceanspaces\.com/);
      if (match) {
        region = match[1];
      }
    }

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    });
  }

  async uploadProductImage(
    file: UploadedFile,
    reference: string,
    isExtra: boolean = false,
    index?: number,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes JPEG, PNG, WebP y GIF.`,
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)} MB). El tamaño máximo es 5 MB.`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.webp';
    let filename: string;

    const accessKeyId = this.configService.get<string>('DO_SPACES_KEY');
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET');

    // Local Disk Fallback if no DO Spaces credentials
    if (!accessKeyId || !secretAccessKey) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      if (isExtra && index !== undefined) {
        filename = `${reference}_extra_${index}${ext}`;
      } else if (isExtra) {
        filename = `${reference}_extra_${uuidv4().slice(0, 8)}${ext}`;
      } else {
        filename = `${reference}_main${ext}`;
      }

      const filepath = path.join(uploadDir, filename);
      await fs.promises.writeFile(filepath, file.buffer);

      const port = this.configService.get<number>('PORT') || 3000;
      const url = `http://localhost:${port}/uploads/${filename}`;
      this.logger.log(`[LOCAL] Imagen guardada en disco: ${url}`);
      return { url };
    }

    if (isExtra && index !== undefined) {
      filename = `products/${reference}_extra_${index}${ext}`;
    } else if (isExtra) {
      filename = `products/${reference}_extra_${uuidv4().slice(0, 8)}${ext}`;
    } else {
      filename = `products/${reference}_main${ext}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const url = `${this.cdnUrl}/${filename}`;
      this.logger.log(`Imagen subida exitosamente: ${url}`);

      return { url };
    } catch (error) {
      this.logger.error(`Error al subir imagen a DigitalOcean Spaces: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `Error al subir la imagen: ${error.message}`,
      );
    }
  }

  async deleteImage(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      this.logger.log(`Imagen eliminada: ${fileKey}`);
    } catch (error) {
      this.logger.error(`Error al eliminar imagen: ${error.message}`, error.stack);
    }
  }
}
