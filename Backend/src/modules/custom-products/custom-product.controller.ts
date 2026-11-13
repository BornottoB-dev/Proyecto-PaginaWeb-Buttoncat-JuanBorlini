import type { Request, Response, NextFunction } from 'express';
import { CustomProductService } from './custom-product.service.js';

export class CustomProductController {
  // --- Plantillas Custom ---
  static async getTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.all !== 'true';
      const templates = await CustomProductService.getAllTemplates(onlyActive);
      res.json({ success: true, data: templates });
    } catch (error) {
      next(error);
    }
  }

  static async getTemplateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPlantilla = Number(req.params.idPlantilla);
      const template = await CustomProductService.getTemplateById(idPlantilla);
      if (!template) {
        res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
        return;
      }
      res.json({ success: true, data: template });
    } catch (error) {
      next(error);
    }
  }

  static async createTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await CustomProductService.createTemplate(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPlantilla = Number(req.params.idPlantilla);
      const updated = await CustomProductService.updateTemplate(idPlantilla, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPlantilla = Number(req.params.idPlantilla);
      await CustomProductService.deleteTemplate(idPlantilla);
      res.json({ success: true, message: 'Plantilla desactivada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Variaciones ---
  static async addVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPlantilla = Number(req.params.idPlantilla);
      const variation = await CustomProductService.addVariation(idPlantilla, req.body);
      res.status(201).json({ success: true, data: variation });
    } catch (error) {
      next(error);
    }
  }

  static async updateVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      const updated = await CustomProductService.updateVariation(idVariacion, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      await CustomProductService.deleteVariation(idVariacion);
      res.json({ success: true, message: 'Variacion desactivada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Opciones ---
  static async addOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      const option = await CustomProductService.addOption(idVariacion, req.body);
      res.status(201).json({ success: true, data: option });
    } catch (error) {
      next(error);
    }
  }

  static async updateOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOpcion = Number(req.params.idOpcion);
      const updated = await CustomProductService.updateOption(idOpcion, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOpcion = Number(req.params.idOpcion);
      await CustomProductService.deleteOption(idOpcion);
      res.json({ success: true, message: 'Opcion desactivada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Producto Customizado ---
  static async createCustomProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await CustomProductService.createCustomProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idProductoCustom)
        ? req.params.idProductoCustom[0]
        : req.params.idProductoCustom;
      const product = await CustomProductService.getCustomProductById(idParam);
      if (!product) {
        res.status(404).json({ success: false, error: 'Producto personalizado no encontrado' });
        return;
      }
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  // --- Favoritos ---
  static async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.body.idCliente);
      const idParam = Array.isArray(req.params.idProductoCustom)
        ? req.params.idProductoCustom[0]
        : req.params.idProductoCustom;
      const result = await CustomProductService.toggleFavorite(idCliente, idParam);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getClientFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const favorites = await CustomProductService.getClientFavorites(idCliente);
      res.json({ success: true, data: favorites });
    } catch (error) {
      next(error);
    }
  }
}

