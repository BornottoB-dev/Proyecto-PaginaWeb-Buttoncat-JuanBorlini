import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { productRouter } from './product.routes.js';
import { categoryRouter } from './category.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);

