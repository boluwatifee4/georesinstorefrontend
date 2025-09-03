import { computed, inject, Injectable, signal } from '@angular/core';
import { switchMap, catchError, of } from 'rxjs';
import { AdminProductsService, CreateProductRequest, UpdateProductRequest } from '../../../api/admin/products/products.service';
import { Product } from '../../../types/api.types';

export interface AdminProductsState {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminProductsStore {
  private readonly productsService = inject(AdminProductsService);

  // Private signals
  private readonly _state = signal<AdminProductsState>({
    products: [],
    currentProduct: null,
    loading: false,
    error: null,
    pagination: { total: 0, page: 1, limit: 20 }
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly products = computed(() => this._state().products);
  readonly currentProduct = computed(() => this._state().currentProduct);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);

  // Actions
  loadProducts(filters?: any) {
    this.setLoading(true);
    this.productsService.getProducts(filters).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load products');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.setProducts(response.data);
        this.setPagination({
          total: response.total,
          page: response.page,
          limit: response.limit
        });
      }
      this.setLoading(false);
    });
  }

  loadProduct(id: number) {
    this.setLoading(true);
    this.productsService.getProductById(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load product');
        return of(null);
      })
    ).subscribe(product => {
      if (product) {
        this.setCurrentProduct(product);
      }
      this.setLoading(false);
    });
  }

  createProduct(productData: CreateProductRequest) {
    this.setLoading(true);
    return this.productsService.createProduct(productData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to create product');
        return of(null);
      })
    );
  }

  updateProduct(id: number, productData: UpdateProductRequest) {
    this.setLoading(true);
    return this.productsService.updateProduct(id, productData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to update product');
        return of(null);
      })
    );
  }

  deleteProduct(id: number) {
    this.setLoading(true);
    return this.productsService.deleteProduct(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to delete product');
        return of(null);
      })
    );
  }

  addMedia(productId: number, mediaData: any) {
    this.setLoading(true);
    return this.productsService.addMedia(productId, mediaData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to add media');
        return of(null);
      })
    );
  }

  removeMedia(productId: number, mediaId: number) {
    this.setLoading(true);
    return this.productsService.removeMedia(productId, mediaId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to remove media');
        return of(null);
      })
    );
  }

  assignToCategory(productId: number, categoryId: number) {
    this.setLoading(true);
    return this.productsService.assignToCategory(productId, categoryId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to assign to category');
        return of(null);
      })
    );
  }

  removeFromCategory(productId: number, categoryId: number) {
    this.setLoading(true);
    return this.productsService.removeFromCategory(productId, categoryId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to remove from category');
        return of(null);
      })
    );
  }

  // Private state updaters
  private setProducts(products: Product[]) {
    this._state.update(state => ({ ...state, products, error: null }));
  }

  private setCurrentProduct(product: Product) {
    this._state.update(state => ({ ...state, currentProduct: product, error: null }));
  }

  private setLoading(loading: boolean) {
    this._state.update(state => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update(state => ({ ...state, error }));
  }

  private setPagination(pagination: { total: number; page: number; limit: number }) {
    this._state.update(state => ({ ...state, pagination }));
  }
}
