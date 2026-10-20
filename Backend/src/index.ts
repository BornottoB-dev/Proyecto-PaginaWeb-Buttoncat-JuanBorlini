import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

const app = express();

// Middlewares globales
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(requestLogger);

// Rutas de la API
app.use('/api', apiRouter);

// Manejo de 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
  });
});

// Middleware global de errores
app.use(errorHandler);

// Inicializar servidor
const server = app.listen(env.PORT, () => {
  console.log(`[Buttoncat API]: Servidor escuchando en http://localhost:${env.PORT}`);
  console.log(`[Buttoncat API]: Entorno: ${env.NODE_ENV}`);
});

// Cierre graceful
const shutdown = async () => {
  console.log('\n[Buttoncat API]: Apagando servidor...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[Buttoncat API]: Conexiones cerradas exitosamente.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
