import type { Request, Response, NextFunction } from 'express';
import { LocationService } from './locations.service.js';

export class LocationController {
  static async getProvincias(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const provincias = await LocationService.getAllProvincias();
      res.json({ success: true, data: provincias });
    } catch (error) {
      next(error);
    }
  }

  static async getProvinciaById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProvincia = Number(req.params.idProvincia);
      const provincia = await LocationService.getProvinciaById(idProvincia);
      if (!provincia) {
        res.status(404).json({ success: false, error: 'Provincia no encontrada' });
        return;
      }
      res.json({ success: true, data: provincia });
    } catch (error) {
      next(error);
    }
  }

  static async createProvincia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { provincia } = req.body;
      const created = await LocationService.createProvincia({ provincia });
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async updateProvincia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProvincia = Number(req.params.idProvincia);
      const { provincia } = req.body;
      const updated = await LocationService.updateProvincia(idProvincia, { provincia });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProvincia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProvincia = Number(req.params.idProvincia);
      await LocationService.deleteProvincia(idProvincia);
      res.json({ success: true, message: 'Provincia eliminada' });
    } catch (error) {
      next(error);
    }
  }

  static async getLocalidades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProvincia = req.query.idProvincia ? Number(req.query.idProvincia) : undefined;
      const localidades = idProvincia
        ? await LocationService.getLocalidadesByProvincia(idProvincia)
        : await LocationService.getAllLocalidades();
      res.json({ success: true, data: localidades });
    } catch (error) {
      next(error);
    }
  }

  static async getLocalidadesByProvincia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProvincia = Number(req.params.idProvincia);
      const localidades = await LocationService.getLocalidadesByProvincia(idProvincia);
      res.json({ success: true, data: localidades });
    } catch (error) {
      next(error);
    }
  }

  static async createLocalidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idProvincia, localidad } = req.body;
      const created = await LocationService.createLocalidad({
        idProvincia: Number(idProvincia),
        localidad,
      });
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async updateLocalidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idLocalidad = Number(req.params.idLocalidad);
      const { idProvincia, localidad } = req.body;
      const updated = await LocationService.updateLocalidad(idLocalidad, {
        idProvincia: idProvincia !== undefined ? Number(idProvincia) : undefined,
        localidad,
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteLocalidad(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idLocalidad = Number(req.params.idLocalidad);
      await LocationService.deleteLocalidad(idLocalidad);
      res.json({ success: true, message: 'Localidad eliminada' });
    } catch (error) {
      next(error);
    }
  }
}

