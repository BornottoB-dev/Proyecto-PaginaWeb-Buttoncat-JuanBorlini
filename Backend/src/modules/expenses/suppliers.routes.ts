import { Router } from 'express';
import { ExpenseController } from './expenses.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const supplierRouter = Router();

supplierRouter.get('/', ExpenseController.getSuppliers);
supplierRouter.get('/:idProveedor', ExpenseController.getSupplierById);
supplierRouter.post('/', adminMiddleware, ExpenseController.createSupplier);
supplierRouter.put('/:idProveedor', adminMiddleware, ExpenseController.updateSupplier);
supplierRouter.delete('/:idProveedor', adminMiddleware, ExpenseController.deleteSupplier);

