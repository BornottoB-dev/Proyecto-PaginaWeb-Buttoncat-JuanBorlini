import { Router } from 'express';
import { LocationController } from './locations.controller.js';
import { adminMiddleware } from '../../middlewares/auth.middleware.js';

export const locationRouter = Router();

// Provincias
locationRouter.get('/provincias', LocationController.getProvincias);
locationRouter.get('/provincias/:idProvincia', LocationController.getProvinciaById);
locationRouter.post('/provincias', adminMiddleware, LocationController.createProvincia);
locationRouter.put('/provincias/:idProvincia', adminMiddleware, LocationController.updateProvincia);
locationRouter.delete('/provincias/:idProvincia', adminMiddleware, LocationController.deleteProvincia);

// Localidades
locationRouter.get('/localidades', LocationController.getLocalidades);
locationRouter.get('/provincias/:idProvincia/localidades', LocationController.getLocalidadesByProvincia);
locationRouter.post('/localidades', adminMiddleware, LocationController.createLocalidad);
locationRouter.put('/localidades/:idLocalidad', adminMiddleware, LocationController.updateLocalidad);
locationRouter.delete('/localidades/:idLocalidad', adminMiddleware, LocationController.deleteLocalidad);

