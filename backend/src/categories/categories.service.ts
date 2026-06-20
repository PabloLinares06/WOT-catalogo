import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto, UpdateCategoryOrderDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: dto.id }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe una categoría con ese id o nombre`,
      );
    }

    return this.prisma.category.create({
      data: {
        id: dto.id,
        name: dto.name,
        order: dto.order ?? 0,
        isOriginal: dto.isOriginal ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOneOrFail(id);

    if (dto.name) {
      const nameConflict = await this.prisma.category.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (nameConflict) {
        throw new ConflictException(`Ya existe una categoría con el nombre "${dto.name}"`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isOriginal !== undefined && { isOriginal: dto.isOriginal }),
      },
    });
  }

  async updateOrder(id: string, dto: UpdateCategoryOrderDto) {
    await this.findOneOrFail(id);

    return this.prisma.category.update({
      where: { id },
      data: { order: dto.order },
    });
  }

  async remove(id: string) {
    await this.findOneOrFail(id);

    const hasProducts = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (hasProducts > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría porque tiene ${hasProducts} producto(s) asociado(s)`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  private async findOneOrFail(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Categoría con id "${id}" no encontrada`);
    }
    return category;
  }
}
