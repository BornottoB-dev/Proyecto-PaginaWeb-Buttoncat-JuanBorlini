import type { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service.js';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = typeof req.query.category === 'string' ? req.query.category : undefined;
      const products = await ProductService.getAll(categoryId);
      res.json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await ProductService.getById(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}
