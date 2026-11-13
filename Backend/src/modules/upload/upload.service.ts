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

export class UploadService {
  /**
   * Sube una imagen en formato Base64 o URL remota a Cloudinary
   */
  static async uploadBase64(
    base64Data: string,
    folder: string = 'buttoncat'
  ): Promise<UploadResult> {
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
  }

  /**
   * Sube un buffer de archivo (proveniente de multer) a Cloudinary mediante stream
   */
  static async uploadBuffer(
    buffer: Buffer,
    folder: string = 'buttoncat'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
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
  }

  /**
   * Elimina una imagen de Cloudinary a partir de su publicId
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  }
}

