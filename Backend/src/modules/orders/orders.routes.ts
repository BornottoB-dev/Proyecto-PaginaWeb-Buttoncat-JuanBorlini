import { Router } from 'express';
import { OrderController } from './orders.controller.js';
import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../../middlewares/auth.middleware.js';

export const orderRouter = Router();

orderRouter.post('/', optionalAuthMiddleware, OrderController.create);
orderRouter.get('/', authMiddleware, OrderController.getAll);
orderRouter.get('/:idPedido', authMiddleware, OrderController.getById);
orderRouter.put('/:idPedido', adminMiddleware, OrderController.update);
orderRouter.patch('/:idPedido/status', adminMiddleware, OrderController.updateStatus);
orderRouter.patch('/:idPedido/tracking', adminMiddleware, OrderController.updateTracking);
orderRouter.delete('/:idPedido', adminMiddleware, OrderController.delete);

