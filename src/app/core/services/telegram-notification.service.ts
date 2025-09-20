import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TelegramMessage {
  orderCode: string;
  buyerName: string;
  total: string;
  phone?: string;
  email?: string;
  declaredAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class TelegramNotificationService {
  private readonly http = inject(HttpClient);
  private readonly botToken = environment.telegram.botToken;
  private readonly chatId = environment.telegram.chatId;

  /**
   * Send payment declaration notification to Telegram
   */
  sendPaymentDeclaredNotification(messageData: TelegramMessage): Observable<any> {
    if (!this.botToken || !this.chatId) {
      console.warn('Telegram bot configuration missing. Skipping notification.');
      return of(null);
    }

    const message = this.formatPaymentMessage(messageData);

    return this.sendTelegramMessage(message).pipe(
      tap(() => {
        // console.log('Telegram notification sent successfully');
      }),
      catchError(error => {
        console.error('Failed to send Telegram notification:', error);
        return of(null); // Don't fail the main process if telegram fails
      })
    );
  }

  /**
   * Format the payment declaration message
   */
  private formatPaymentMessage(data: TelegramMessage): string {
    const formattedDate = new Date(data.declaredAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `🔔 *Payment Declared*\n\n`;
    message += `📋 *Order:* \`${data.orderCode}\`\n`;
    message += `👤 *Customer:* ${data.buyerName}\n`;
    message += `💰 *Amount:* ₦${parseFloat(data.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n`;

    if (data.phone) {
      message += `📞 *Phone:* ${data.phone}\n`;
    }

    if (data.email) {
      message += `📧 *Email:* ${data.email}\n`;
    }

    message += `⏰ *Declared At:* ${formattedDate}\n\n`;
    message += `⚠️ *Action Required:* Please review and confirm this payment in the admin panel.`;

    return message;
  }

  /**
   * Send message to Telegram using Bot API
   */
  private sendTelegramMessage(message: string): Observable<any> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const payload = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    };

    return this.http.post(url, payload);
  }

  /**
   * Test the Telegram configuration
   */
  testConnection(): Observable<any> {
    if (!this.botToken || !this.chatId) {
      console.error('Telegram bot configuration missing');
      return of({ success: false, error: 'Configuration missing' });
    }

    const testMessage = '🧪 *Test Message*\n\nTelegram notifications are working correctly!';

    return this.sendTelegramMessage(testMessage).pipe(
      tap(() => {
        // console.log('Telegram test message sent successfully');
      }),
      catchError(error => {
        console.error('Telegram test failed:', error);
        return of({ success: false, error: error.message });
      })
    );
  }
}
