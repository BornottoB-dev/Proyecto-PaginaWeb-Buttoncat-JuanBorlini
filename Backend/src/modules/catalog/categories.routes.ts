import { Router } from 'express';
import { CategoryController } from './categories.controller.js';

export const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getAll);
categoryRouter.get('/:idCategoria', CategoryController.getById);
categoryRouter.post('/', CategoryController.create);
categoryRouter.put('/:idCategoria', CategoryController.update);
categoryRouter.delete('/:idCategoria', CategoryController.delete);

