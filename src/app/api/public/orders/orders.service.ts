import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Order } from '../../../types/api.types';

export interface SaveOrderRequest {
  cartId: string;
  locationLabel?: string;
}

export interface DeclarePaymentRequest {
  cartId: string;
  buyerName: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  locationLabel?: string;
}

export interface SaveOrderResponse {
  orderCode: string;
  subTotal: string;
  deliveryFee: string | null;
  total: string;
}

export interface DeclarePaymentResponse {
  orderCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  total: string;
}

@Injectable({ providedIn: 'root' })
export class PublicOrdersService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Save order from cart
   */
  saveOrder(request: SaveOrderRequest): Observable<SaveOrderResponse> {
    return this.apiHttp.post<SaveOrderResponse>('/orders/save', request);
  }

  /**
   * Declare payment for order
   */
  declarePayment(request: DeclarePaymentRequest): Observable<DeclarePaymentResponse> {
    return this.apiHttp.post<DeclarePaymentResponse>('/orders/declare-payment', request);
  }

  /**
   * Lookup order by code (readonly)
   */
  lookupOrder(orderCode: string): Observable<Order> {
    return this.apiHttp.get<Order>(`/orders/lookup/${orderCode}`);
  }

  /**
   * Get order by code
   */
  getOrder(orderCode: string): Observable<Order> {
    return this.apiHttp.get<Order>(`/orders/${orderCode}`);
  }
}
