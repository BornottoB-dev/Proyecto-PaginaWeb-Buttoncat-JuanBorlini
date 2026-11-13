import { Router } from 'express';
import { PaymentController } from './payments.controller.js';

export const paymentRouter = Router();

paymentRouter.get('/', PaymentController.getAll);
paymentRouter.get('/methods', PaymentController.getAll);
paymentRouter.get('/:idMetodoPago', PaymentController.getById);
paymentRouter.post('/', PaymentController.create);
paymentRouter.put('/:idMetodoPago', PaymentController.update);
paymentRouter.delete('/:idMetodoPago', PaymentController.delete);

