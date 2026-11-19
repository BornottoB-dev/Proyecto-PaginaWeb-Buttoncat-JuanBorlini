import type { Request, Response, NextFunction } from 'express';
import { ClientService } from './clients.service.js';

export class ClientController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
      const clients = await ClientService.getAll(activo);
      res.json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const client = await ClientService.getById(idCliente);
      if (!client) {
        res.status(404).json({ success: false, error: 'Cliente no encontrado' });
        return;
      }
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, nombreCompleto, contrasenaHash, telefono, puntos } = req.body;
      const client = await ClientService.create({
        correo,
        nombreCompleto,
        contrasenaHash: contrasenaHash || 'hash_dummy_placeholder',
        telefono,
        puntos,
      });
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const updated = await ClientService.update(idCliente, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // --- Domicilios ---
  static async getDomicilios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const domicilios = await ClientService.getDomicilios(idCliente);
      res.json({ success: true, data: domicilios });
    } catch (error) {
      next(error);
    }
  }

  static async createDomicilio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const domicilio = await ClientService.createDomicilio(idCliente, req.body);
      res.status(201).json({ success: true, data: domicilio });
    } catch (error) {
      next(error);
    }
  }

  static async updateDomicilio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const idDomicilio = Number(req.params.idDomicilio);
      const updated = await ClientService.updateDomicilio(idDomicilio, idCliente, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteDomicilio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const idDomicilio = Number(req.params.idDomicilio);
      await ClientService.deleteDomicilio(idDomicilio, idCliente);
      res.json({ success: true, message: 'Domicilio eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  // --- Favoritos ---
  static async getFavoritos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const favoritos = await ClientService.getFavoritos(idCliente);
      res.json({ success: true, data: favoritos });
    } catch (error) {
      next(error);
    }
  }

  static async toggleFavorito(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const idProducto = Number(req.params.idProducto);
      const result = await ClientService.toggleFavorito(idCliente, idProducto);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // --- Reseñas ---
  static async getResenas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const resenas = await ClientService.getResenas(idCliente);
      res.json({ success: true, data: resenas });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      await ClientService.delete(idCliente);
      res.json({ success: true, message: 'Cliente eliminado con exito' });
    } catch (error) {
      next(error);
    }
  }
}

