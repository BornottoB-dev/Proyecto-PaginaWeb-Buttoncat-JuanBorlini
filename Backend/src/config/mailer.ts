import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from './env.js';

let cachedTransporter: Transporter | null = null;
let isTestTransporter = false;

async function getTransporter(): Promise<{ transporter: Transporter; isTest: boolean }> {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, isTest: isTestTransporter };
  }

  if (env.SMTP_USER && env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    isTestTransporter = false;
    return { transporter: cachedTransporter, isTest: false };
  }

  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  isTestTransporter = true;
  return { transporter: cachedTransporter, isTest: true };
}

export async function sendPasswordResetConfirmationEmail(params: {
  to: string;
  userName: string;
  code: string;
}): Promise<{ messageId: string; previewUrl?: string }> {
  const { transporter, isTest } = await getTransporter();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 3px solid #000000; background-color: #FDFBF7;">
      <div style="background-color: #FFE600; border-bottom: 3px solid #000000; padding: 16px 20px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; color: #000000;">
          BUTTONCAT - CONFIRMACION DE CAMBIO DE CONTRASENA
        </h2>
      </div>
      <div style="padding: 24px 20px; color: #18181B;">
        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700;">
          Hola, ${params.userName}:
        </p>
        <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
          Recibimos una solicitud para restablecer la contrasena de tu cuenta asociada a <strong>${params.to}</strong>.
          Ingresa el siguiente codigo de verificacion de 6 digitos en la ventana de acceso de Buttoncat para confirmar el cambio:
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background-color: #FFFFFF; border: 3px solid #000000; padding: 12px 28px; font-size: 26px; font-weight: 900; letter-spacing: 6px; color: #000000;">
            ${params.code}
          </div>
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #52525B;">
          Este codigo tiene una validez de <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo y tu contrasena actual seguira siendo la misma.
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to: params.to,
    subject: `Codigo de confirmacion Buttoncat: ${params.code}`,
    text: `Hola ${params.userName}, tu codigo de confirmacion para cambiar tu contrasena en Buttoncat es: ${params.code} (valido por 15 minutos).`,
    html,
  });

  const rawPreview = isTest ? nodemailer.getTestMessageUrl(info) : undefined;
  const previewUrl = typeof rawPreview === 'string' ? rawPreview : undefined;

  console.log(`[Buttoncat Mailer]: Correo de confirmacion enviado a ${params.to} (Codigo: ${params.code})`);
  if (previewUrl) {
    console.log(`[Buttoncat Mailer]: Vista previa del correo (Ethereal SMTP): ${previewUrl}`);
  }

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
