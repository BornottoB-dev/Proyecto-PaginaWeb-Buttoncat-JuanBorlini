import { Router } from 'express';
import { ExpenseController } from './expenses.controller.js';

export const expenseRouter = Router();

// Resumen general
expenseRouter.get('/summary', ExpenseController.getSummary);

// Categorias de Gasto
expenseRouter.get('/categories', ExpenseController.getCategories);
expenseRouter.post('/categories', ExpenseController.createCategory);
expenseRouter.put('/categories/:idCategoriaGasto', ExpenseController.updateCategory);

// Gastos
expenseRouter.get('/', ExpenseController.getAllExpenses);
expenseRouter.get('/:idGasto', ExpenseController.getExpenseById);
expenseRouter.post('/', ExpenseController.createExpense);
expenseRouter.put('/:idGasto', ExpenseController.updateExpense);
expenseRouter.delete('/:idGasto', ExpenseController.deleteExpense);

