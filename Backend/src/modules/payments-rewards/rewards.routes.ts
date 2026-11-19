import { Router } from 'express';
import { RewardController } from './rewards.controller.js';
import { adminMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware.js';

export const rewardRouter = Router();

// Categorias de Premio
rewardRouter.get('/categories', RewardController.getCategories);
rewardRouter.post('/categories', adminMiddleware, RewardController.createCategory);
rewardRouter.put('/categories/:idCategoriaPremio', adminMiddleware, RewardController.updateCategory);
rewardRouter.delete('/categories/:idCategoriaPremio', adminMiddleware, RewardController.deleteCategory);

// Premios
rewardRouter.get('/', RewardController.getAll);
rewardRouter.get('/:idPremio', RewardController.getById);
rewardRouter.post('/', adminMiddleware, RewardController.create);
rewardRouter.put('/:idPremio', adminMiddleware, RewardController.update);
rewardRouter.delete('/:idPremio', adminMiddleware, RewardController.delete);

// Canje y Validacion
rewardRouter.post('/claim', optionalAuthMiddleware, RewardController.claimReward);
rewardRouter.get('/client/:idCliente', optionalAuthMiddleware, RewardController.getClientRewards);
rewardRouter.get('/validate/:codigoPremio', RewardController.validateCode);

