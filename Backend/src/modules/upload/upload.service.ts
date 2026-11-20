import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cloudinary } from '../../config/cloudinary.js';
import type { UploadApiResponse } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

function saveLocalBuffer(buffer: Buffer, folder: string, ext = 'png'): UploadResult {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '');
  const targetDir = path.resolve(process.cwd(), 'uploads', safeFolder);
  fs.mkdirSync(targetDir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, buffer);

  const relativeUrl = `/uploads/${safeFolder}/${filename}`;
  return {
    url: relativeUrl,
    publicId: `local-${safeFolder}-${filename}`,
    format: ext,
    bytes: buffer.length,
  };
}

function saveLocalBase64(base64Data: string, folder: string): UploadResult {
  let ext = 'png';
  let cleanData = base64Data;
  const match = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
  if (match) {
    ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    cleanData = base64Data.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
  }
  const buffer = Buffer.from(cleanData, 'base64');
  return saveLocalBuffer(buffer, folder, ext);
}

export class UploadService {
  /**
   * Sube una imagen en formato Base64 o URL remota a Cloudinary, con fallback a disco local
   */
  static async uploadBase64(
    base64Data: string,
    folder: string = 'buttoncat'
  ): Promise<UploadResult> {
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      };
    } catch (error) {
      console.warn('[UploadService] Cloudinary upload falló, guardando en almacenamiento local:', (error as any)?.message || error);
      return saveLocalBase64(base64Data, folder);
    }
  }

  /**
   * Sube un buffer de archivo (proveniente de multer) a Cloudinary, con fallback a disco local
   */
  static async uploadBuffer(
    buffer: Buffer,
    folder: string = 'buttoncat'
  ): Promise<UploadResult> {
    try {
      return await new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            transformation: [
              { quality: 'auto', fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Error al subir buffer a Cloudinary'));
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes,
            });
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.warn('[UploadService] Cloudinary buffer upload falló, guardando en almacenamiento local:', (error as any)?.message || error);
      return saveLocalBuffer(buffer, folder);
    }
  }

  /**
   * Elimina una imagen de Cloudinary a partir de su publicId
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    if (publicId.startsWith('local-')) {
      return true;
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  }
}

