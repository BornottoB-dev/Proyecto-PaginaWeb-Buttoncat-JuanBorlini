import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';

export const productRouter = Router();

productRouter.get('/', ProductController.getAll);
productRouter.get('/:id', ProductController.getById);
