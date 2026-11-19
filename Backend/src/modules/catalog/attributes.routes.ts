import { Router } from 'express';
import { AttributeController } from './attributes.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const attributeRouter = Router();

// Estilos
attributeRouter.get('/styles', AttributeController.getStyles);
attributeRouter.post('/styles', adminMiddleware, AttributeController.createStyle);
attributeRouter.put('/styles/:idEstilo', adminMiddleware, AttributeController.updateStyle);
attributeRouter.delete('/styles/:idEstilo', adminMiddleware, AttributeController.deleteStyle);

// Etiquetas
attributeRouter.get('/tags', AttributeController.getTags);
attributeRouter.post('/tags', adminMiddleware, AttributeController.createTag);
attributeRouter.put('/tags/:idEtiqueta', adminMiddleware, AttributeController.updateTag);
attributeRouter.delete('/tags/:idEtiqueta', adminMiddleware, AttributeController.deleteTag);

// Variaciones
attributeRouter.get('/variations', AttributeController.getVariations);
attributeRouter.post('/variations', adminMiddleware, AttributeController.createVariation);
attributeRouter.put('/variations/:idVariacion', adminMiddleware, AttributeController.updateVariation);
attributeRouter.delete('/variations/:idVariacion', adminMiddleware, AttributeController.deleteVariation);
attributeRouter.post('/variations/:idVariacion/options', adminMiddleware, AttributeController.addOption);
attributeRouter.put('/options/:idOpcionVariacion', adminMiddleware, AttributeController.updateOption);
attributeRouter.delete('/options/:idOpcionVariacion', adminMiddleware, AttributeController.deleteOption);

