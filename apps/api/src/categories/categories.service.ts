import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, type?: TransactionType) {
    return this.prisma.category.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          type: dto.type,
          icon: dto.icon,
          color: dto.color,
          userId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async update(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });
  }

  async remove(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId, deletedAt: null },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId, userId },
    });

    if (transactionCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing transactions',
      );
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() },
    });
  }
}
