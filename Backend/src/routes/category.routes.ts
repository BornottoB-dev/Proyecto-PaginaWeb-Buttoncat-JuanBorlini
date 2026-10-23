import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getAll);
categoryRouter.get('/:id', CategoryController.getById);
categoryRouter.post('/', CategoryController.create);
categoryRouter.put('/:id', CategoryController.update);
categoryRouter.delete('/:id', CategoryController.delete);
