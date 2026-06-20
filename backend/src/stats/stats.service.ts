import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalProducts, activeProducts, totalCategories, totalBanners] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.category.count(),
        this.prisma.banner.count(),
      ]);

    return {
      totalProducts,
      activeProducts,
      totalCategories,
      totalBanners,
    };
  }
}
