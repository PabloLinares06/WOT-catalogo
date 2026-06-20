import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.banner.findMany({
      orderBy: { id: 'asc' },
    });
  }

  create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        desktopUrl: dto.desktopUrl,
        mobileUrl: dto.mobileUrl,
      },
    });
  }

  async update(id: number, dto: UpdateBannerDto) {
    await this.findOneOrFail(id);

    return this.prisma.banner.update({
      where: { id },
      data: {
        ...(dto.desktopUrl !== undefined && { desktopUrl: dto.desktopUrl }),
        ...(dto.mobileUrl !== undefined && { mobileUrl: dto.mobileUrl }),
      },
    });
  }

  async remove(id: number) {
    await this.findOneOrFail(id);
    return this.prisma.banner.delete({ where: { id } });
  }

  private async findOneOrFail(id: number) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner con id ${id} no encontrado`);
    }
    return banner;
  }
}
