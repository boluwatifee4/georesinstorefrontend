import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Order } from '../../../types/api.types';

export interface OrderFilters {
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface RejectOrderRequest {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * List and search orders
   */
  getOrders(filters?: OrderFilters): Observable<OrderListResponse> {
    return this.apiHttp.adminGet<OrderListResponse>('/admin/orders', {
      params: filters as any
    });
  }

  /**
   * Get order detail
   */
  getOrder(id: number): Observable<Order> {
    return this.apiHttp.adminGet<Order>(`/admin/orders/${id}`);
  }

  /**
   * Set order status to under review
   */
  setUnderReview(id: number): Observable<Order> {
    return this.apiHttp.adminPost<Order>(`/admin/orders/${id}/under-review`, {});
  }

  /**
   * Approve order and decrement inventory
   */
  approveOrder(id: number): Observable<Order> {
    return this.apiHttp.adminPost<Order>(`/admin/orders/${id}/approve`, {});
  }

  /**
   * Reject order with reason
   */
  rejectOrder(id: number, request: RejectOrderRequest): Observable<Order> {
    return this.apiHttp.adminPost<Order>(`/admin/orders/${id}/reject`, request);
  }

  /**
   * Create manual quote for order
   */
  createManualQuote(id: number, quoteData: any): Observable<Order> {
    return this.apiHttp.adminPost<Order>(`/admin/orders/${id}/quote`, quoteData);
  }
}
