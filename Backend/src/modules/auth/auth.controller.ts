import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  static async register(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { email, password, name, phone } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ success: false, error: 'Email, contrasena y nombre son obligatorios' });
        return;
      }
      const result = await AuthService.register({ email, password, name, phone });
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message || 'Error al registrar usuario' });
    }
  }

  static async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email y contrasena son obligatorios' });
        return;
      }
      const result = await AuthService.login({ email, password });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message || 'Credenciales invalidas' });
    }
  }

  static async getMe(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'No autenticado' });
        return;
      }
      const user = await AuthService.getMe(req.user.idCliente);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message || 'Usuario no encontrado' });
    }
  }
}

