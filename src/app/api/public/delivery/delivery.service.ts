import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';

export interface DeliveryQuoteRequest {
  locationLabel: string;
}

export interface DeliveryQuoteResponse {
  fee?: string;
  zoneName?: string;
  needsManualQuote?: boolean;
  whatsappLink?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicDeliveryService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Get delivery quote for location
   */
  getQuote(request: DeliveryQuoteRequest): Observable<DeliveryQuoteResponse> {
    return this.apiHttp.post<DeliveryQuoteResponse>('/delivery/quote', request);
  }
}
