import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { emailConfig } from '../../config/email.config';

interface SendEmailOptions {
  email: string;
  subject: string;
  message?: string;
  html?: string;
  from?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly from: string;
  private readonly brand: string;

  constructor(private configService: ConfigService) {
    const config = emailConfig(configService);
    this.apiKey = config.apiKey;
    this.from = config.from;
    this.brand = config.brand;
  }

  private escapeHtml(unsafe: string): string {
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildHtml(message: string, title: string): string {
    const safeMessage = this.escapeHtml(message).replace(/\n/g, '<br/>');
    const safeTitle = this.escapeHtml(title);

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; padding:0; background:#f4f6f8; }
    .wrapper { width:100%; padding:24px 0; }
    .card { max-width:700px; margin:0 auto; background:#ffffff; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.06); overflow:hidden; }
    .header { background: linear-gradient(90deg,#0ea5a4,#06b6d4); color:#fff; padding:18px 24px; font-size:20px; }
    .body { padding:24px; color:#111827; line-height:1.6; font-size:15px; }
    .footer { padding:16px 24px; font-size:13px; color:#6b7280; background:#fbfdff; text-align:center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">${safeTitle}</div>
      <div class="body">${safeMessage}</div>
      <div class="footer">This email was sent by ${safeTitle}. If you didn't expect this message, please ignore it.</div>
    </div>
  </div>
</body>
</html>`;
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { email, subject, message, html, from } = options;

    if (!email) {
      throw new Error('sendEmail: email is required');
    }
    if (!subject) {
      throw new Error('sendEmail: subject is required');
    }
    if (!message && !html) {
      throw new Error('sendEmail: message or html is required');
    }

    const htmlContent = html || this.buildHtml(message || '', this.brand);

    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: from || this.from, name: this.brand },
          to: [{ email }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Email sent to ${email}`);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.error(
          `Email sending failed: ${JSON.stringify(error.response.data)}`,
        );
      } else {
        this.logger.error(`Email sending failed: ${(error as Error).message}`);
      }
      throw new Error('Email could not be sent');
    }
  }
}
