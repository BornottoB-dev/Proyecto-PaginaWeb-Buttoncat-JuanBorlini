import { Router } from 'express';
import multer from 'multer';
import { UploadController } from './upload.controller.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max por archivo
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen validos (PNG, JPG, WEBP, etc.)'));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post('/', upload.single('file'), UploadController.uploadSingle);
uploadRouter.post('/multiple', upload.array('files', 10), UploadController.uploadMultiple);
uploadRouter.delete('/:publicId', UploadController.deleteImage);

