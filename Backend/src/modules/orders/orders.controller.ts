import type { Request, Response, NextFunction } from 'express';
import { OrderService } from './orders.service.js';
import type { EstadoPedido } from '../../types/database.types.js';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = { ...req.body };
      if (!payload.idCliente && req.user?.idCliente) {
        payload.idCliente = req.user.idCliente;
      }
      const order = await OrderService.create(payload);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Autenticacion requerida para consultar pedidos' });
        return;
      }

      let idCliente: number | undefined;
      if (req.user.role === 'ADMIN') {
        idCliente = req.query.idCliente ? Number(req.query.idCliente) : undefined;
      } else {
        idCliente = req.user.idCliente ? Number(req.user.idCliente) : undefined;
        if (!idCliente) {
          res.json({ success: true, data: [] });
          return;
        }
      }

      const estado = req.query.estado as EstadoPedido | undefined;
      const fechaDesde = req.query.desde ? new Date(req.query.desde as string) : undefined;
      const fechaHasta = req.query.hasta ? new Date(req.query.hasta as string) : undefined;
      const page = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
      const limit = req.query.limit ? Math.min(Math.max(1, Number(req.query.limit)), 100) : undefined;

      const result = await OrderService.getAll({
        idCliente,
        estado,
        fechaDesde,
        fechaHasta,
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
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Autenticacion requerida' });
        return;
      }

      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      const order = await OrderService.getById(idPedido);
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }

      if (req.user.role !== 'ADMIN' && order.idCliente !== req.user.idCliente) {
        res.status(403).json({ success: false, error: 'Acceso denegado a este pedido' });
        return;
      }

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      const updated = await OrderService.update(idPedido, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      const { estado } = req.body;
      const updated = await OrderService.updateStatus(idPedido, estado);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async updateTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      const { codigoSeguimiento, costoDeEnvio } = req.body;
      const updated = await OrderService.updateTracking(idPedido, {
        codigoSeguimiento,
        costoDeEnvio: costoDeEnvio !== undefined ? Number(costoDeEnvio) : undefined,
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      await OrderService.delete(idPedido);
      res.json({ success: true, message: 'Pedido eliminado con exito' });
    } catch (error) {
      next(error);
    }
  }
}
