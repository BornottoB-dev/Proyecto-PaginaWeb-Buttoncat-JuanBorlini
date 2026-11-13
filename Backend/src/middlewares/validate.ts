import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

export const validateBody = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as typeof req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodTypeAny) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.params);
      req.params = parsed as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
};
