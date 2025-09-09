import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Product, ProductMedia } from '../../../types/api.types';

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class PublicProductsService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Get products with filters and pagination
   */
  getProducts(filters?: ProductFilters): Observable<ProductListResponse> {
    return this.apiHttp.get<ProductListResponse>('/products', {
      params: filters as any
    });
  }

  /**
   * Get featured products (homepage)
   */
  getFeaturedProducts(limit?: number): Observable<Product[]> {
    const params: any = {};
    if (typeof limit === 'number') params.limit = limit;
    return this.apiHttp.get<Product[]>('/products/featured', { params });
  }

  /**
   * Get product detail by slug
   */
  getProductBySlug(slug: string): Observable<Product & {
    media: ProductMedia[];
    variants: any[];
    optionGroups: any[];
  }> {
    return this.apiHttp.get(`/products/${slug}`);
  }
}
