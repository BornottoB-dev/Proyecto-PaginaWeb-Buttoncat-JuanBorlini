import type { Request, Response, NextFunction } from 'express';
import { ExpenseService } from './expenses.service.js';

export class ExpenseController {
  // --- Proveedores ---
  static async getSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.all !== 'true';
      const suppliers = await ExpenseService.getAllSuppliers(onlyActive);
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  }

  static async getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProveedor = Number(req.params.idProveedor);
      const supplier = await ExpenseService.getSupplierById(idProveedor);
      if (!supplier) {
        res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
        return;
      }
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = await ExpenseService.createSupplier(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProveedor = Number(req.params.idProveedor);
      const updated = await ExpenseService.updateSupplier(idProveedor, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProveedor = Number(req.params.idProveedor);
      await ExpenseService.deleteSupplier(idProveedor);
      res.json({ success: true, message: 'Proveedor desactivado' });
    } catch (error) {
      next(error);
    }
  }

  // --- Categorias de Gasto ---
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.all !== 'true';
      const categories = await ExpenseService.getAllCategories(onlyActive);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const created = await ExpenseService.createCategory(req.body);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoriaGasto = Number(req.params.idCategoriaGasto);
      const updated = await ExpenseService.updateCategory(idCategoriaGasto, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // --- Gastos ---
  static async getAllExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idProveedor = req.query.idProveedor ? Number(req.query.idProveedor) : undefined;
      const idCategoriaGasto = req.query.idCategoriaGasto ? Number(req.query.idCategoriaGasto) : undefined;
      const idMetodoPago = req.query.idMetodoPago ? Number(req.query.idMetodoPago) : undefined;
      const fechaDesde = req.query.desde ? new Date(req.query.desde as string) : undefined;
      const fechaHasta = req.query.hasta ? new Date(req.query.hasta as string) : undefined;

      const expenses = await ExpenseService.getAllExpenses({
        idProveedor,
        idCategoriaGasto,
        idMetodoPago,
        fechaDesde,
        fechaHasta,
      });

      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idGasto = Number(req.params.idGasto);
      const expense = await ExpenseService.getExpenseById(idGasto);
      if (!expense) {
        res.status(404).json({ success: false, error: 'Gasto no encontrado' });
        return;
      }
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await ExpenseService.createExpense({
        ...req.body,
        montoTotal: Number(req.body.montoTotal),
        idCategoriaGasto: Number(req.body.idCategoriaGasto),
        idMetodoPago: Number(req.body.idMetodoPago),
        idProveedor: Number(req.body.idProveedor),
        fechaGasto: req.body.fechaGasto ? new Date(req.body.fechaGasto) : undefined,
      });
      res.status(201).json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idGasto = Number(req.params.idGasto);
      const updated = await ExpenseService.updateExpense(idGasto, {
        ...req.body,
        montoTotal: req.body.montoTotal !== undefined ? Number(req.body.montoTotal) : undefined,
        idCategoriaGasto: req.body.idCategoriaGasto !== undefined ? Number(req.body.idCategoriaGasto) : undefined,
        idMetodoPago: req.body.idMetodoPago !== undefined ? Number(req.body.idMetodoPago) : undefined,
        idProveedor: req.body.idProveedor !== undefined ? Number(req.body.idProveedor) : undefined,
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idGasto = Number(req.params.idGasto);
      await ExpenseService.deleteExpense(idGasto);
      res.json({ success: true, message: 'Gasto eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await ExpenseService.getSummary();
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

