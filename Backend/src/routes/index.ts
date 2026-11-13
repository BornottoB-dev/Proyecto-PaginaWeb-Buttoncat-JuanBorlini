import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { locationRouter } from '../modules/locations/locations.routes.js';
import { clientRouter } from '../modules/clients/clients.routes.js';
import { catalogRouter } from '../modules/catalog/index.js';
import { categoryRouter } from '../modules/catalog/categories.routes.js';
import { productRouter } from '../modules/catalog/products.routes.js';
import { paymentRouter } from '../modules/payments-rewards/payments.routes.js';
import { rewardRouter } from '../modules/payments-rewards/rewards.routes.js';
import { orderRouter } from '../modules/orders/orders.routes.js';
import { supplierRouter } from '../modules/expenses/suppliers.routes.js';
import { expenseRouter } from '../modules/expenses/expenses.routes.js';
import { customProductRouter } from '../modules/custom-products/custom-product.routes.js';
import { uploadRouter } from '../modules/upload/upload.routes.js';
import { authRouter } from '../modules/auth/auth.routes.js';

export const apiRouter = Router();

// Healthcheck
apiRouter.use('/health', healthRouter);

// Autenticacion y Sesiones
apiRouter.use('/auth', authRouter);

// Modulo 1: Geografia y Ubicacion
apiRouter.use('/locations', locationRouter);

// Modulo 2: Clientes y Domicilios
apiRouter.use('/clients', clientRouter);

// Modulo 3: Catalogo y Productos
apiRouter.use('/catalog', catalogRouter);
// Aliases directos para compatibilidad con el frontend
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);

// Modulo 4: Metodos de Pago y Premios (Fidelizacion)
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/rewards', rewardRouter);

// Modulo 5: Pedidos y Checkout
apiRouter.use('/orders', orderRouter);

// Modulo 6: Proveedores y Gastos
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/expenses', expenseRouter);

// Modulo 7: Producto Custom (Fase final)
apiRouter.use('/custom', customProductRouter);

// Servicio de Almacenamiento de Imagenes (Cloudinary)
apiRouter.use('/upload', uploadRouter);
