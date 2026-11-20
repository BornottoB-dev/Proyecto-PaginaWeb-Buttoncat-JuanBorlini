import { Router } from 'express';
import { ProductController } from './products.controller.js';
import { adminMiddleware, authMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware.js';

export const productRouter = Router();

productRouter.get('/', optionalAuthMiddleware, ProductController.getAll);
productRouter.get('/:idProducto', optionalAuthMiddleware, ProductController.getById);
productRouter.post('/', adminMiddleware, ProductController.create);
productRouter.put('/:idProducto', adminMiddleware, ProductController.update);
productRouter.delete('/:idProducto', adminMiddleware, ProductController.delete);

// Reseñas de producto
productRouter.get('/:idProducto/reviews', ProductController.getReviews);
productRouter.post('/:idProducto/reviews', authMiddleware, ProductController.addReview);
productRouter.delete('/:idProducto/reviews/:idResena', adminMiddleware, ProductController.deleteReview);

