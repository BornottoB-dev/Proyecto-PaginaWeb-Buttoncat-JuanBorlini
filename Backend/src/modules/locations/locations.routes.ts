import { Router } from 'express';
import { LocationController } from './locations.controller.js';

export const locationRouter = Router();

// Provincias
locationRouter.get('/provincias', LocationController.getProvincias);
locationRouter.get('/provincias/:idProvincia', LocationController.getProvinciaById);
locationRouter.post('/provincias', LocationController.createProvincia);

// Localidades
locationRouter.get('/localidades', LocationController.getLocalidades);
locationRouter.get('/provincias/:idProvincia/localidades', LocationController.getLocalidadesByProvincia);
locationRouter.post('/localidades', LocationController.createLocalidad);

