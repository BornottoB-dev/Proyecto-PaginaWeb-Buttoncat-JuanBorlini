import type { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service.js';

export class UploadController {
  static async uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const folder = (req.body.folder as string) || 'buttoncat';

      // 1. Archivo enviado via FormData (multer)
      if (req.file) {
        const result = await UploadService.uploadBuffer(req.file.buffer, folder);
        res.json({ success: true, data: result });
        return;
      }

      // 2. Imagen enviada via JSON (Base64 o URL externa)
      if (req.body.image && typeof req.body.image === 'string') {
        const result = await UploadService.uploadBase64(req.body.image, folder);
        res.json({ success: true, data: result });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Debe proporcionar una imagen mediante multipart (campo file) o en el cuerpo JSON (campo image en Base64).',
      });
    } catch (error) {
      next(error);
    }
  }

  static async uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const folder = (req.body.folder as string) || 'buttoncat';

      // 1. Archivos via FormData
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        const uploadPromises = req.files.map((file) =>
          UploadService.uploadBuffer(file.buffer, folder)
        );
        const results = await Promise.all(uploadPromises);
        res.json({ success: true, data: results });
        return;
      }

      // 2. Imagenes via JSON array
      if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        const uploadPromises = req.body.images.map((img: string) =>
          UploadService.uploadBase64(img, folder)
        );
        const results = await Promise.all(uploadPromises);
        res.json({ success: true, data: results });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Debe proporcionar una lista de imagenes en files o images.',
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicId = Array.isArray(req.params.publicId)
        ? req.params.publicId[0]
        : req.params.publicId;
      if (!publicId) {
        res.status(400).json({ success: false, error: 'publicId es requerido' });
        return;
      }
      const success = await UploadService.deleteImage(publicId);
      res.json({ success, message: 'Imagen eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}
