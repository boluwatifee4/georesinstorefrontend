import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';

@Injectable({ providedIn: 'root' })
export class PublicNotificationsService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * POST /notifications/telegram
   * Sends a Telegram message via backend
   */
  sendTelegram(message: string): Observable<any> {
    return this.apiHttp.post<any>('notifications/telegram', { message });
  }
}
