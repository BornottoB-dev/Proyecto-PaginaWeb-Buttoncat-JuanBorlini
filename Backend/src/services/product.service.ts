import { prisma } from '../config/prisma.js';

export class ProductService {
  static async getAll(categoryId?: string) {
    return prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        category: true,
        variations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variations: true,
      },
    });
  }
}
