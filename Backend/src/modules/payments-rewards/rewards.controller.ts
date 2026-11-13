import type { Request, Response, NextFunction } from 'express';
import { RewardService } from './rewards.service.js';

export class RewardController {
  // --- Categorias ---
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await RewardService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoria } = req.body;
      const created = await RewardService.createCategory(categoria);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoriaPremio = Number(req.params.idCategoriaPremio);
      const { categoria } = req.body;
      const updated = await RewardService.updateCategory(idCategoriaPremio, categoria);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCategoriaPremio = Number(req.params.idCategoriaPremio);
      await RewardService.deleteCategory(idCategoriaPremio);
      res.json({ success: true, message: 'Categoria de premio eliminada con exito' });
    } catch (error) {
      next(error);
    }
  }

  // --- Catalogo de Premios ---
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const onlyActive = req.query.all !== 'true';
      const rewards = await RewardService.getAll(onlyActive);
      res.json({ success: true, data: rewards });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPremio = Number(req.params.idPremio);
      const reward = await RewardService.getById(idPremio);
      if (!reward) {
        res.status(404).json({ success: false, error: 'Premio no encontrado' });
        return;
      }
      res.json({ success: true, data: reward });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reward = await RewardService.create(req.body);
      res.status(201).json({ success: true, data: reward });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPremio = Number(req.params.idPremio);
      const updated = await RewardService.update(idPremio, req.body);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idPremio = Number(req.params.idPremio);
      await RewardService.delete(idPremio);
      res.json({ success: true, message: 'Premio desactivado' });
    } catch (error) {
      next(error);
    }
  }

  // --- Canje y validacion ---
  static async claimReward(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idCliente, idPremio } = req.body;
      const claimed = await RewardService.claimReward(Number(idCliente), Number(idPremio));
      res.status(201).json({ success: true, data: claimed });
    } catch (error) {
      next(error);
    }
  }

  static async getClientRewards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idCliente = Number(req.params.idCliente);
      const rewards = await RewardService.getClientRewards(idCliente);
      res.json({ success: true, data: rewards });
    } catch (error) {
      next(error);
    }
  }

  static async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const codigoParam = Array.isArray(req.params.codigoPremio)
        ? req.params.codigoPremio[0]
        : req.params.codigoPremio;
      const result = await RewardService.validateRewardCode(codigoParam);
      if (!result.valid) {
        res.status(400).json({ success: false, error: result.error });
        return;
      }
      res.json({ success: true, data: result.data });
    } catch (error) {
      next(error);
    }
  }
}
