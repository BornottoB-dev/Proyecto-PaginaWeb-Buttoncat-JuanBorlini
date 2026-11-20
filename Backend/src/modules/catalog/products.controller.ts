import type { Request, Response, NextFunction } from 'express';
import { ProductService } from './products.service.js';
import type { CanalDeVenta } from '../../types/database.types.js';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'ADMIN';

      const idCategoria = req.query.categoria ? Number(req.query.categoria) : undefined;
      const idEstilo = req.query.estilo ? Number(req.query.estilo) : undefined;
      const idEtiqueta = req.query.etiqueta ? Number(req.query.etiqueta) : undefined;

      // Control de estado activo:
      // Si no es admin, el catálogo público SIEMPRE filtra por productos activos (activo = true).
      // Si es admin, puede filtrar explícitamente o ver todos.
      const activo = isAdmin
        ? (req.query.activo !== undefined ? req.query.activo === 'true' : undefined)
        : true;

      // Control de canal de venta:
      // Si no es admin, el catálogo público online solo muestra productos habilitados para web ('WEB' o 'AMBOS').
      // Los productos exclusivos de tienda física ('LOCAL') no se muestran al público.
      let canalDeVenta: CanalDeVenta | undefined;
      let canalesPermitidos: CanalDeVenta[] | undefined;
      if (isAdmin) {
        canalDeVenta = req.query.canalDeVenta as CanalDeVenta | undefined;
      } else {
        canalesPermitidos = ['WEB', 'AMBOS'];
      }

      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Math.min(Math.max(1, Number(req.query.limit)), 100) : undefined;

      const result = await ProductService.getAll({
        idCategoria,
        idEstilo,
        idEtiqueta,
        activo,
        canalDeVenta,
        canalesPermitidos,
        search,
        page,
        limit,
        isAdmin,
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
      const isAdmin = req.user?.role === 'ADMIN';
      const product = await ProductService.getById(idProducto, isAdmin);

      if (!product) {
        res.status(404).json({ success: false, error: 'Producto no encontrado' });
        return;
      }

      // Restricciones para clientes y público no administrador:
      if (!isAdmin) {
        if (!product.activo) {
          res.status(404).json({ success: false, error: 'Producto no disponible en el catálogo' });
          return;
        }
        if (product.canalDeVenta === 'LOCAL') {
          res.status(404).json({ success: false, error: 'Producto exclusivo para venta en tienda física' });
          return;
        }
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

