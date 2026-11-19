import { Router } from 'express';
import { CustomProductController } from './custom-product.controller.js';
import { adminMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware.js';

export const customProductRouter = Router();

// Estado general del modulo
customProductRouter.get('/status', (_req, res) => {
  res.json({
    success: true,
    message: 'Modulo de Producto Custom activo con soporte completo de SVG y plantillas.',
  });
});

// Plantillas Custom
customProductRouter.get('/templates', CustomProductController.getTemplates);
customProductRouter.get('/templates/:idPlantilla', CustomProductController.getTemplateById);
customProductRouter.post('/templates', adminMiddleware, CustomProductController.createTemplate);
customProductRouter.put('/templates/:idPlantilla', adminMiddleware, CustomProductController.updateTemplate);
customProductRouter.delete('/templates/:idPlantilla', adminMiddleware, CustomProductController.deleteTemplate);

// Variaciones de Plantilla
customProductRouter.post('/templates/:idPlantilla/variations', adminMiddleware, CustomProductController.addVariation);
customProductRouter.put('/variations/:idVariacion', adminMiddleware, CustomProductController.updateVariation);
customProductRouter.delete('/variations/:idVariacion', adminMiddleware, CustomProductController.deleteVariation);

// Opciones de Variacion
customProductRouter.post('/variations/:idVariacion/options', adminMiddleware, CustomProductController.addOption);
customProductRouter.put('/options/:idOpcion', adminMiddleware, CustomProductController.updateOption);
customProductRouter.delete('/options/:idOpcion', adminMiddleware, CustomProductController.deleteOption);

// Productos Personalizados (Creacion por Cliente & Previsualizacion)
customProductRouter.post('/products', optionalAuthMiddleware, CustomProductController.createCustomProduct);
customProductRouter.get('/products/:idProductoCustom', CustomProductController.getCustomProductById);

// Favoritos de Custom
customProductRouter.post('/products/:idProductoCustom/favorite', optionalAuthMiddleware, CustomProductController.toggleFavorite);
customProductRouter.get('/favorites/client/:idCliente', optionalAuthMiddleware, CustomProductController.getClientFavorites);
