import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, EMPTY } from 'rxjs';
import { PublicProductsService, ProductFilters } from '../../../api/public/products/products.service';
import { Product } from '../../../types/api.types';

export interface ProductsState {
  products: Product[];
  currentProduct: Product | null;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

@Injectable({ providedIn: 'root' })
export class ProductsStore {
  private readonly productsService = inject(PublicProductsService);

  // Private signals
  private readonly _state = signal<ProductsState>({
    products: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: { page: 1, limit: 20 },
    pagination: { total: 0, page: 1, limit: 20 }
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly products = computed(() => this._state().products);
  readonly currentProduct = computed(() => this._state().currentProduct);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly filters = computed(() => this._state().filters);
  readonly pagination = computed(() => this._state().pagination);

  // Computed
  readonly hasProducts = computed(() => this._state().products.length > 0);
  readonly hasMore = computed(() => {
    const { page, limit, total } = this._state().pagination;
    return page * limit < total;
  });

  constructor() {
    // Auto-load products when filters change
    toObservable(this.filters).pipe(
      switchMap(filters => {
        this.setLoading(true);
        return this.productsService.getProducts(filters).pipe(
          catchError(error => {
            this.setError(error.message || 'Failed to load products');
            return of(null);
          })
        );
      })
    ).subscribe(response => {
      if (response) {
        this.setProducts(response.products);
        this.setPagination({
          total: response.total,
          page: response.page,
          limit: response.limit
        });
      }
      this.setLoading(false);
    });
  }

  // Actions
  loadProducts(filters?: Partial<ProductFilters>) {
    const newFilters = { ...this._state().filters, ...filters };
    this.setFilters(newFilters);
  }

  loadProductBySlug(slug: string) {
    this.setLoading(true);
    this.productsService.getProductBySlug(slug).pipe(
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

  private setFilters(filters: ProductFilters) {
    this._state.update(state => ({ ...state, filters }));
  }

  private setPagination(pagination: { total: number; page: number; limit: number }) {
    this._state.update(state => ({ ...state, pagination }));
  }
}
