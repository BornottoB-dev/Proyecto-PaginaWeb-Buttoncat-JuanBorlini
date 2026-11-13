import type { Request, Response, NextFunction } from 'express';
import { CategoryService } from './categories.service.js';

export class CategoryController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getAll();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoria = Number(req.params.idCategoria);
      const category = await CategoryService.getById(idCategoria);
      if (!category) {
        res.status(404).json({ success: false, error: 'Categoria no encontrada' });
        return;
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await CategoryService.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoria = Number(req.params.idCategoria);
      const category = await CategoryService.update(idCategoria, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoria = Number(req.params.idCategoria);
      await CategoryService.delete(idCategoria);
      res.json({ success: true, message: 'Categoria eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

