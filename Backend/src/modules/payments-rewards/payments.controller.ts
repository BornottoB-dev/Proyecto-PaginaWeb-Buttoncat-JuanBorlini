import type { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payments.service.js';

export class PaymentController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.all !== 'true';
      const methods = await PaymentService.getAll(onlyActive);
      res.json({ success: true, data: methods });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idMetodoPago = Number(req.params.idMetodoPago);
      const method = await PaymentService.getById(idMetodoPago);
      if (!method) {
        res.status(404).json({ success: false, error: 'Metodo de pago no encontrado' });
        return;
      }
      res.json({ success: true, data: method });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const method = await PaymentService.create(req.body);
      res.status(201).json({ success: true, data: method });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idMetodoPago = Number(req.params.idMetodoPago);
      const updated = await PaymentService.update(idMetodoPago, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idMetodoPago = Number(req.params.idMetodoPago);
      await PaymentService.delete(idMetodoPago);
      res.json({ success: true, message: 'Metodo de pago desactivado' });
    } catch (error) {
      next(error);
    }
  }
}

