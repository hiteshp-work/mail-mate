import nodemailer from 'nodemailer';
import { AppSettings } from './types';

export async function sendEmailViaSmtp(
  settings: AppSettings,
  emailData: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }
) {
  if (!settings.smtp.enabled || !settings.smtp.host) {
    throw new Error('SMTP is not enabled or host is missing in settings');
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.pass,
    },
  });

  const fromAddress = `"${settings.smtp.fromName || 'MailMate Tracker'}" <${settings.smtp.fromEmail || settings.smtp.user}>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: emailData.to,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
  });

  return info;
}

export async function verifySmtpConnection(settings: AppSettings) {
  if (!settings.smtp.host) {
    throw new Error('SMTP Host is required');
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtp.host,
    port: settings.smtp.port,
    secure: settings.smtp.secure,
    auth: {
      user: settings.smtp.user,
      pass: settings.smtp.pass,
    },
  });

  await transporter.verify();
  return true;
}
