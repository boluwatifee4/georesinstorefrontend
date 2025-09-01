import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Product, ProductMedia } from '../../../types/api.types';

export interface CreateProductRequest {
  title: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateProductRequest {
  title?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  featured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface AddMediaRequest {
  url: string;
  alt?: string;
  position?: number;
  isPrimary?: boolean;
}

export interface AdminProductListResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Create new product
   */
  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.apiHttp.adminPost<Product>('/admin/products', request);
  }

  /**
   * Get all products (admin view)
   */
  getProducts(filters?: any): Observable<AdminProductListResponse> {
    return this.apiHttp.adminGet<AdminProductListResponse>('/admin/products', {
      params: filters
    });
  }

  /**
   * Get product by ID
   */
  getProductById(id: number): Observable<Product> {
    return this.apiHttp.adminGet<Product>(`/admin/products/${id}`);
  }

  /**
   * Update product
   */
  updateProduct(id: number, request: UpdateProductRequest): Observable<Product> {
    return this.apiHttp.adminPatch<Product>(`/admin/products/${id}`, request);
  }

  /**
   * Delete product
   */
  deleteProduct(id: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/products/${id}`);
  }

  /**
   * Add media to product
   */
  addMedia(productId: number, request: AddMediaRequest): Observable<ProductMedia> {
    return this.apiHttp.adminPost<ProductMedia>(`/admin/products/${productId}/media`, request);
  }

  /**
   * Remove media from product
   */
  removeMedia(productId: number, mediaId: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/products/${productId}/media/${mediaId}`);
  }

  /**
   * Assign product to category
   */
  assignToCategory(productId: number, categoryId: number): Observable<void> {
    return this.apiHttp.adminPost<void>(`/admin/products/${productId}/categories/${categoryId}`, {});
  }

  /**
   * Remove product from category
   */
  removeFromCategory(productId: number, categoryId: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/products/${productId}/categories/${categoryId}`);
  }
}
