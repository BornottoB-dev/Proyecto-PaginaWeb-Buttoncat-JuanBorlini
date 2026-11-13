import { Router } from 'express';
import { ProductController } from './products.controller.js';

export const productRouter = Router();

productRouter.get('/', ProductController.getAll);
productRouter.get('/:idProducto', ProductController.getById);
productRouter.post('/', ProductController.create);
productRouter.put('/:idProducto', ProductController.update);
productRouter.delete('/:idProducto', ProductController.delete);

// Reseñas de producto
productRouter.get('/:idProducto/reviews', ProductController.getReviews);
productRouter.post('/:idProducto/reviews', ProductController.addReview);

