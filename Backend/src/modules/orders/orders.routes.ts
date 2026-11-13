import { Router } from 'express';
import { OrderController } from './orders.controller.js';
import { optionalAuthMiddleware } from '../../middlewares/auth.middleware.js';

export const orderRouter = Router();

orderRouter.post('/', optionalAuthMiddleware, OrderController.create);
orderRouter.get('/', optionalAuthMiddleware, OrderController.getAll);
orderRouter.get('/:idPedido', OrderController.getById);
orderRouter.patch('/:idPedido/status', OrderController.updateStatus);
orderRouter.patch('/:idPedido/tracking', OrderController.updateTracking);
orderRouter.delete('/:idPedido', OrderController.delete);

