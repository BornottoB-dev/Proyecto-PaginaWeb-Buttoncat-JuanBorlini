import { Router } from 'express';
import { ClientController } from './clients.controller.js';
import { authMiddleware, adminMiddleware, clientOrAdminMiddleware } from '../../middlewares/auth.middleware.js';

export const clientRouter = Router();

// Clientes base
clientRouter.get('/', adminMiddleware, ClientController.getAll);
clientRouter.get('/:idCliente', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.getById);
clientRouter.post('/', adminMiddleware, ClientController.create);
clientRouter.put('/:idCliente', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.update);
clientRouter.delete('/:idCliente', adminMiddleware, ClientController.delete);

// Domicilios del cliente
clientRouter.get('/:idCliente/domicilios', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.getDomicilios);
clientRouter.post('/:idCliente/domicilios', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.createDomicilio);
clientRouter.put('/:idCliente/domicilios/:idDomicilio', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.updateDomicilio);
clientRouter.delete('/:idCliente/domicilios/:idDomicilio', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.deleteDomicilio);

// Favoritos del cliente
clientRouter.get('/:idCliente/favoritos', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.getFavoritos);
clientRouter.post('/:idCliente/favoritos/:idProducto', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.toggleFavorito);

// Reseñas del cliente
clientRouter.get('/:idCliente/resenas', authMiddleware, clientOrAdminMiddleware('idCliente'), ClientController.getResenas);

