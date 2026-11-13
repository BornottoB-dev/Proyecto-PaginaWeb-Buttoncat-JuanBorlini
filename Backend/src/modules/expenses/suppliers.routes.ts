import { Router } from 'express';
import { ExpenseController } from './expenses.controller.js';

export const supplierRouter = Router();

supplierRouter.get('/', ExpenseController.getSuppliers);
supplierRouter.get('/:idProveedor', ExpenseController.getSupplierById);
supplierRouter.post('/', ExpenseController.createSupplier);
supplierRouter.put('/:idProveedor', ExpenseController.updateSupplier);
supplierRouter.delete('/:idProveedor', ExpenseController.deleteSupplier);

