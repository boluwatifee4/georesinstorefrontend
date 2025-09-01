import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { ProductVariant } from '../../../types/api.types';

export interface UpdateVariantRequest {
  sku?: string;
  price?: string;
  inventory?: number;
  isActive?: boolean;
  imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminVariantsService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Generate variants for product
   */
  generateVariants(productId: number): Observable<ProductVariant[]> {
    return this.apiHttp.adminPost<ProductVariant[]>(`/admin/products/${productId}/variants/generate`, {});
  }

  /**
   * Get specific variant
   */
  getVariant(variantId: number): Observable<ProductVariant> {
    return this.apiHttp.adminGet<ProductVariant>(`/admin/variants/${variantId}`);
  }

  /**
   * Update variant
   */
  updateVariant(variantId: number, request: UpdateVariantRequest): Observable<ProductVariant> {
    return this.apiHttp.adminPatch<ProductVariant>(`/admin/variants/${variantId}`, request);
  }
}
