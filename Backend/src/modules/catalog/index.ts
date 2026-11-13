import { Router } from 'express';
import { categoryRouter } from './categories.routes.js';
import { attributeRouter } from './attributes.routes.js';
import { productRouter } from './products.routes.js';

export const catalogRouter = Router();

catalogRouter.use('/categories', categoryRouter);
catalogRouter.use('/attributes', attributeRouter);
catalogRouter.use('/products', productRouter);

