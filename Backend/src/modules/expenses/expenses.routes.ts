import { Router } from 'express';
import { ExpenseController } from './expenses.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const expenseRouter = Router();

// Resumen general
expenseRouter.get('/summary', ExpenseController.getSummary);

// Categorias de Gasto
expenseRouter.get('/categories', ExpenseController.getCategories);
expenseRouter.post('/categories', adminMiddleware, ExpenseController.createCategory);
expenseRouter.put('/categories/:idCategoriaGasto', adminMiddleware, ExpenseController.updateCategory);
expenseRouter.delete('/categories/:idCategoriaGasto', adminMiddleware, ExpenseController.deleteCategory);

// Gastos
expenseRouter.get('/', ExpenseController.getAllExpenses);
expenseRouter.get('/:idGasto', ExpenseController.getExpenseById);
expenseRouter.post('/', adminMiddleware, ExpenseController.createExpense);
expenseRouter.put('/:idGasto', adminMiddleware, ExpenseController.updateExpense);
expenseRouter.delete('/:idGasto', adminMiddleware, ExpenseController.deleteExpense);

