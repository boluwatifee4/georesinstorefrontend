import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { AppConfig } from '../../../types/api.types';

export interface UpdateConfigRequest {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  whatsappLink?: string;
  checkoutNote?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminConfigService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Get application configuration
   */
  getConfig(): Observable<AppConfig> {
    return this.apiHttp.adminGet<AppConfig>('/admin/config');
  }

  /**
   * Update application configuration
   */
  updateConfig(request: UpdateConfigRequest): Observable<AppConfig> {
    return this.apiHttp.adminPatch<AppConfig>('/admin/config', request);
  }
}
