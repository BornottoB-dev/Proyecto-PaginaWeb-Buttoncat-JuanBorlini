import { prisma } from '../config/prisma.js';

export interface CreateVariationTypeInput {
  name: string;
  defaultOptions?: string[];
  order?: number;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
  variationTypes?: CreateVariationTypeInput[];
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  basePrice?: number;
  bgColor?: string;
  variationTypes?: CreateVariationTypeInput[];
}

export class CategoryService {
  static async getAll() {
    return prisma.category.findMany({
      include: {
        variationTypes: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        variationTypes: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  static async create(data: CreateCategoryInput) {
    const { variationTypes, ...categoryData } = data;
    return prisma.category.create({
      data: {
        ...categoryData,
        variationTypes: variationTypes && variationTypes.length > 0
          ? {
              create: variationTypes.map((vt, index) => ({
                name: vt.name.trim().toUpperCase(),
                defaultOptions: vt.defaultOptions || [],
                order: vt.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        variationTypes: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  static async update(id: string, data: UpdateCategoryInput) {
    const { variationTypes, ...categoryData } = data;

    return prisma.$transaction(async (tx) => {
      if (variationTypes !== undefined) {
        await tx.categoryVariationType.deleteMany({
          where: { categoryId: id },
        });

        if (variationTypes.length > 0) {
          await tx.categoryVariationType.createMany({
            data: variationTypes.map((vt, index) => ({
              categoryId: id,
              name: vt.name.trim().toUpperCase(),
              defaultOptions: vt.defaultOptions || [],
              order: vt.order ?? index,
            })),
          });
        }
      }

      return tx.category.update({
        where: { id },
        data: categoryData,
        include: {
          variationTypes: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  static async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}
