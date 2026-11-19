import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthUserPayload {
  idUsuario?: number;
  idCliente?: number | null;
  email: string;
  role: 'ADMIN' | 'CLIENTE';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de autenticacion no provisto o invalido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Token expirado o invalido' });
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignorar error si es opcional
    }
  }
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Token de administrador requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    if (decoded.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Acceso denegado: se requieren permisos de administrador',
      });
      return;
    }
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token expirado o invalido' });
  }
}

export function clientOrAdminMiddleware(paramName: string = 'idCliente') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Autenticacion requerida' });
      return;
    }

    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const rawId = req.params[paramName] || req.body[paramName] || req.query[paramName];
    const targetId = Number(rawId);

    if (req.user.idCliente && !isNaN(targetId) && req.user.idCliente === targetId) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Acceso denegado: no tienes permisos para acceder a los datos de este cliente',
    });
  };
}

