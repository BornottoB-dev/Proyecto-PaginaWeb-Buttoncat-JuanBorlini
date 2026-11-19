import { Router } from 'express';
import { CategoryController } from './categories.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getAll);
categoryRouter.get('/:idCategoria', CategoryController.getById);
categoryRouter.post('/', adminMiddleware, CategoryController.create);
categoryRouter.put('/:idCategoria', adminMiddleware, CategoryController.update);
categoryRouter.delete('/:idCategoria', adminMiddleware, CategoryController.delete);

