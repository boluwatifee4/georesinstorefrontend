import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ConfigResponse {
  id: number;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  whatsappLink: string;
  checkoutNote: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://georesinstore-api.onrender.com';

  getConfig(): Observable<ConfigResponse> {
    return this.http.get<ConfigResponse>(`${this.baseUrl}/config`);
  }
}
