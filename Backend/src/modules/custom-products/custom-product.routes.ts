import { Router } from 'express';
import { CustomProductController } from './custom-product.controller.js';

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
customProductRouter.post('/templates', CustomProductController.createTemplate);
customProductRouter.put('/templates/:idPlantilla', CustomProductController.updateTemplate);
customProductRouter.delete('/templates/:idPlantilla', CustomProductController.deleteTemplate);

// Variaciones de Plantilla
customProductRouter.post('/templates/:idPlantilla/variations', CustomProductController.addVariation);
customProductRouter.put('/variations/:idVariacion', CustomProductController.updateVariation);
customProductRouter.delete('/variations/:idVariacion', CustomProductController.deleteVariation);

// Opciones de Variacion
customProductRouter.post('/variations/:idVariacion/options', CustomProductController.addOption);
customProductRouter.put('/options/:idOpcion', CustomProductController.updateOption);
customProductRouter.delete('/options/:idOpcion', CustomProductController.deleteOption);

// Productos Personalizados (Creacion por Cliente & Previsualizacion)
customProductRouter.post('/products', CustomProductController.createCustomProduct);
customProductRouter.get('/products/:idProductoCustom', CustomProductController.getCustomProductById);

// Favoritos de Custom
customProductRouter.post('/products/:idProductoCustom/favorite', CustomProductController.toggleFavorite);
customProductRouter.get('/favorites/client/:idCliente', CustomProductController.getClientFavorites);
