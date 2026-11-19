import type { Request, Response, NextFunction } from 'express';
import { AttributeService } from './attributes.service.js';

export class AttributeController {
  // --- Estilos ---
  static async getStyles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const styles = await AttributeService.getAllStyles();
      res.json({ success: true, data: styles });
    } catch (error) {
      next(error);
    }
  }

  static async createStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const style = await AttributeService.createStyle(req.body);
      res.status(201).json({ success: true, data: style });
    } catch (error) {
      next(error);
    }
  }

  static async updateStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEstilo = Number(req.params.idEstilo);
      const style = await AttributeService.updateStyle(idEstilo, req.body);
      res.json({ success: true, data: style });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStyle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEstilo = Number(req.params.idEstilo);
      await AttributeService.deleteStyle(idEstilo);
      res.json({ success: true, message: 'Estilo eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Etiquetas ---
  static async getTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await AttributeService.getAllTags();
      res.json({ success: true, data: tags });
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tag = await AttributeService.createTag(req.body);
      res.status(201).json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEtiqueta = Number(req.params.idEtiqueta);
      const tag = await AttributeService.updateTag(idEtiqueta, req.body);
      res.json({ success: true, data: tag });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idEtiqueta = Number(req.params.idEtiqueta);
      await AttributeService.deleteTag(idEtiqueta);
      res.json({ success: true, message: 'Etiqueta eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Variaciones y Opciones ---
  static async getVariations(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variations = await AttributeService.getAllVariations();
      res.json({ success: true, data: variations });
    } catch (error) {
      next(error);
    }
  }

  static async createVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombreVariacion } = req.body;
      const variation = await AttributeService.createVariation(nombreVariacion);
      res.status(201).json({ success: true, data: variation });
    } catch (error) {
      next(error);
    }
  }

  static async updateVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      const { nombreVariacion } = req.body;
      const variation = await AttributeService.updateVariation(idVariacion, nombreVariacion);
      res.json({ success: true, data: variation });
    } catch (error) {
      next(error);
    }
  }

  static async deleteVariation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      await AttributeService.deleteVariation(idVariacion);
      res.json({ success: true, message: 'Variacion eliminada' });
    } catch (error) {
      next(error);
    }
  }

  static async addOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idVariacion = Number(req.params.idVariacion);
      const { nombreOpcion, precioExtra } = req.body;
      const option = await AttributeService.addOption({
        idVariacion,
        nombreOpcion,
        precioExtra,
      });
      res.status(201).json({ success: true, data: option });
    } catch (error) {
      next(error);
    }
  }

  static async updateOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOpcionVariacion = Number(req.params.idOpcionVariacion);
      const updated = await AttributeService.updateOption(idOpcionVariacion, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteOption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOpcionVariacion = Number(req.params.idOpcionVariacion);
      await AttributeService.deleteOption(idOpcionVariacion);
      res.json({ success: true, message: 'Opcion eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

