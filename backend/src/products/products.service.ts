import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  UpdateProductDto,
  ReorderProductsDto,
  UpdatePriceByReferenceDto,
} from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(active?: string) {
    const where: Prisma.ProductWhereInput = {};

    if (active === 'true') {
      where.isActive = true;
    } else if (active === 'false') {
      where.isActive = false;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { category: true },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${id}" no encontrado`);
    }

    return product;
  }

  async findByReference(reference: string) {
    const product = await this.prisma.product.findUnique({
      where: { reference },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con referencia "${reference}" no encontrado`,
      );
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { reference: dto.reference },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un producto con la referencia "${dto.reference}"`,
      );
    }

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Categoría con id "${dto.categoryId}" no encontrada`,
      );
    }

    const data: Prisma.ProductCreateInput = {
      reference: dto.reference,
      name: dto.name,
      description: dto.description,
      price: new Prisma.Decimal(dto.price),
      imageUrl: dto.imageUrl,
      images: dto.images ?? [],
      category: { connect: { id: dto.categoryId } },
      isActive: dto.isActive ?? true,
      order: dto.order ?? 0,
      hasObservation: dto.hasObservation ?? false,
    };

    if (dto.id) {
      (data as any).id = dto.id;
    }

    return this.prisma.product.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.reference) {
      const conflict = await this.prisma.product.findFirst({
        where: { reference: dto.reference, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `Ya existe un producto con la referencia "${dto.reference}"`,
        );
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Categoría con id "${dto.categoryId}" no encontrada`,
        );
      }
    }

    const updateData: Prisma.ProductUpdateInput = {};

    if (dto.reference !== undefined) updateData.reference = dto.reference;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = new Prisma.Decimal(dto.price);
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.images !== undefined) updateData.images = dto.images;
    if (dto.categoryId !== undefined) updateData.category = { connect: { id: dto.categoryId } };
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.order !== undefined) updateData.order = dto.order;
    if (dto.hasObservation !== undefined) updateData.hasObservation = dto.hasObservation;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async reorder(dto: ReorderProductsDto) {
    const updates = dto.items.map((item) =>
      this.prisma.product.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );

    await this.prisma.$transaction(updates);

    return { message: `${dto.items.length} productos reordenados correctamente` };
  }

  async updatePriceByReference(dto: UpdatePriceByReferenceDto) {
    const product = await this.prisma.product.findUnique({
      where: { reference: dto.reference },
    });

    if (!product) {
      throw new NotFoundException(
        `Producto con referencia "${dto.reference}" no encontrado`,
      );
    }

    return this.prisma.product.update({
      where: { reference: dto.reference },
      data: { price: new Prisma.Decimal(dto.price) },
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
