import { Router } from 'express';
import { AttributeController } from './attributes.controller.js';

export const attributeRouter = Router();

// Estilos
attributeRouter.get('/styles', AttributeController.getStyles);
attributeRouter.post('/styles', AttributeController.createStyle);
attributeRouter.put('/styles/:idEstilo', AttributeController.updateStyle);
attributeRouter.delete('/styles/:idEstilo', AttributeController.deleteStyle);

// Etiquetas
attributeRouter.get('/tags', AttributeController.getTags);
attributeRouter.post('/tags', AttributeController.createTag);
attributeRouter.put('/tags/:idEtiqueta', AttributeController.updateTag);
attributeRouter.delete('/tags/:idEtiqueta', AttributeController.deleteTag);

// Variaciones
attributeRouter.get('/variations', AttributeController.getVariations);
attributeRouter.post('/variations', AttributeController.createVariation);
attributeRouter.post('/variations/:idVariacion/options', AttributeController.addOption);
attributeRouter.put('/options/:idOpcionVariacion', AttributeController.updateOption);
attributeRouter.delete('/options/:idOpcionVariacion', AttributeController.deleteOption);

