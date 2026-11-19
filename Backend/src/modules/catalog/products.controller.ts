import type { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service.js';
import type { CanalDeVenta } from '../../types/database.types.js';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoria = req.query.categoria ? Number(req.query.categoria) : undefined;
      const idEstilo = req.query.estilo ? Number(req.query.estilo) : undefined;
      const idEtiqueta = req.query.etiqueta ? Number(req.query.etiqueta) : undefined;
      const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
      const canalDeVenta = req.query.canalDeVenta as CanalDeVenta | undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Math.min(Math.max(1, Number(req.query.limit)), 100) : undefined;

      const result = await ProductService.getAll({
        idCategoria,
        idEstilo,
        idEtiqueta,
        activo,
        canalDeVenta,
        search,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const product = await ProductService.getById(idProducto);

      if (!product) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
        return;
      }

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const updated = await ProductService.update(idProducto, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const permanent = req.query.permanent === 'true';
      await ProductService.delete(idProducto, !permanent);
      res.json({
        success: true,
        message: permanent ? 'Producto eliminado definitivamente' : 'Producto desactivado',
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Reseñas ---
  static async addReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const { idCliente, calificacion, comentario } = req.body;

      const review = await ProductService.addReview(idProducto, Number(idCliente), {
        calificacion: Number(calificacion),
        comentario,
      });

      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  static async getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const reviews = await ProductService.getReviews(idProducto);
      res.json({ success: true, data: reviews });
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProducto = Number(req.params.idProducto);
      const idResena = Number(req.params.idResena);
      const deleted = await ProductService.deleteReview(idProducto, idResena);
      res.json({ success: true, data: deleted });
    } catch (error) {
      next(error);
    }
  }
}

