import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { DeliveryZone } from '../../../types/api.types';

export interface CreateDeliveryZoneRequest {
  name: string;
  matcher: 'CITY' | 'STATE' | 'CUSTOM';
  value: string;
  fee: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateDeliveryZoneRequest {
  name?: string;
  matcher?: 'CITY' | 'STATE' | 'CUSTOM';
  value?: string;
  fee?: string;
  priority?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminDeliveryZonesService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Create delivery zone
   */
  createDeliveryZone(request: CreateDeliveryZoneRequest): Observable<DeliveryZone> {
    return this.apiHttp.adminPost<DeliveryZone>('/admin/delivery-zones', request);
  }

  /**
   * Get all delivery zones
   */
  getDeliveryZones(): Observable<DeliveryZone[]> {
    return this.apiHttp.adminGet<DeliveryZone[]>('/admin/delivery-zones');
  }

  /**
   * Get specific delivery zone
   */
  getDeliveryZone(id: number): Observable<DeliveryZone> {
    return this.apiHttp.adminGet<DeliveryZone>(`/admin/delivery-zones/${id}`);
  }

  /**
   * Update delivery zone
   */
  updateDeliveryZone(id: number, request: UpdateDeliveryZoneRequest): Observable<DeliveryZone> {
    return this.apiHttp.adminPatch<DeliveryZone>(`/admin/delivery-zones/${id}`, request);
  }

  /**
   * Delete delivery zone
   */
  deleteDeliveryZone(id: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/delivery-zones/${id}`);
  }
}
