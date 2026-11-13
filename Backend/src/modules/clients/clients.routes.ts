import { Router } from 'express';
import { ClientController } from './clients.controller.js';

export const clientRouter = Router();

// Clientes base
clientRouter.get('/', ClientController.getAll);
clientRouter.get('/:idCliente', ClientController.getById);
clientRouter.post('/', ClientController.create);
clientRouter.put('/:idCliente', ClientController.update);
clientRouter.delete('/:idCliente', ClientController.delete);

// Domicilios del cliente
clientRouter.get('/:idCliente/domicilios', ClientController.getDomicilios);
clientRouter.post('/:idCliente/domicilios', ClientController.createDomicilio);
clientRouter.put('/:idCliente/domicilios/:idDomicilio', ClientController.updateDomicilio);
clientRouter.delete('/:idCliente/domicilios/:idDomicilio', ClientController.deleteDomicilio);

// Favoritos del cliente
clientRouter.get('/:idCliente/favoritos', ClientController.getFavoritos);
clientRouter.post('/:idCliente/favoritos/:idProducto', ClientController.toggleFavorito);

// Reseñas del cliente
clientRouter.get('/:idCliente/resenas', ClientController.getResenas);

