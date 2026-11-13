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
      const idCliente = req.query.idCliente ? Number(req.query.idCliente) : undefined;
      const estado = req.query.estado as EstadoPedido | undefined;
      const fechaDesde = req.query.desde ? new Date(req.query.desde as string) : undefined;
      const fechaHasta = req.query.hasta ? new Date(req.query.hasta as string) : undefined;

      const orders = await OrderService.getAll({
        idCliente,
        estado,
        fechaDesde,
        fechaHasta,
      });

      res.json({ success: true, data: orders });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.idPedido) ? req.params.idPedido[0] : req.params.idPedido;
      const idPedido = BigInt(idParam);
      const order = await OrderService.getById(idPedido);
      if (!order) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }
      res.json({ success: true, data: order });
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
