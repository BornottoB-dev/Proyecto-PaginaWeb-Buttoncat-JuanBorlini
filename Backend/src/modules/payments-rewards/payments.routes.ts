import { Router } from 'express';
import { PaymentController } from './payments.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const paymentRouter = Router();

paymentRouter.get('/', PaymentController.getAll);
paymentRouter.get('/methods', PaymentController.getAll);
paymentRouter.get('/:idMetodoPago', PaymentController.getById);
paymentRouter.post('/', adminMiddleware, PaymentController.create);
paymentRouter.put('/:idMetodoPago', adminMiddleware, PaymentController.update);
paymentRouter.delete('/:idMetodoPago', adminMiddleware, PaymentController.delete);

