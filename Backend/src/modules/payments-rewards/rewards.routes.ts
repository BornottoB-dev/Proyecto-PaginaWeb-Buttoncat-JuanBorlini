import { Router } from 'express';
import { RewardController } from './rewards.controller.js';

export const rewardRouter = Router();

// Categorias de Premio
rewardRouter.get('/categories', RewardController.getCategories);
rewardRouter.post('/categories', RewardController.createCategory);
rewardRouter.put('/categories/:idCategoriaPremio', RewardController.updateCategory);
rewardRouter.delete('/categories/:idCategoriaPremio', RewardController.deleteCategory);

// Premios
rewardRouter.get('/', RewardController.getAll);
rewardRouter.get('/:idPremio', RewardController.getById);
rewardRouter.post('/', RewardController.create);
rewardRouter.put('/:idPremio', RewardController.update);
rewardRouter.delete('/:idPremio', RewardController.delete);

// Canje y Validacion
rewardRouter.post('/claim', RewardController.claimReward);
rewardRouter.get('/client/:idCliente', RewardController.getClientRewards);
rewardRouter.get('/validate/:codigoPremio', RewardController.validateCode);

