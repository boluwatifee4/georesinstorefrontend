import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { PublicProductsService, ProductFilters } from '../../../api/public/products/products.service';
import { Product } from '../../../types/api.types';

export interface ProductsState {
  products: Product[];
  featured: Product[];
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
    featured: [],
    currentProduct: null,
    loading: false,
    error: null,
    filters: { page: 1, limit: 20 },
    pagination: { total: 0, page: 1, limit: 20 }
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly products = computed(() => this._state().products);
  readonly featured = computed(() => this._state().featured);
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

  constructor() { }

  // Actions
  loadProducts(filters?: Partial<ProductFilters>) {
    const merged = { ...this._state().filters, ...filters };
    this.setFilters(merged);
    this.fetchProducts();
  }

  reloadProducts() {
    this.fetchProducts();
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

  private setFeatured(products: Product[]) {
    this._state.update(state => ({ ...state, featured: products }));
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

  private fetchProducts() {
    const filters = this._state().filters;
    this.setLoading(true);
    this.productsService.getProducts(filters).pipe(
      catchError(error => {
        const message = (error?.error?.message) || error.message || 'Failed to load products';
        this.setError(message);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        // Support legacy paginated response or new simple array response
        if (Array.isArray(response)) {
          this.setProducts(response as any as Product[]);
          this.setPagination({ total: (response as any).length || 0, page: 1, limit: (response as any).length || filters.limit || 20 });
        } else {
          this.setProducts(response.data);
          this.setPagination({
            total: response.total,
            page: response.page,
            limit: response.limit
          });
        }
      }
      this.setLoading(false);
    });
  }

  loadFeatured(limit?: number) {
    this.productsService.getFeaturedProducts(limit).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load featured products');
        return of(null);
      })
    ).subscribe(products => {
      if (products) {
        this.setFeatured(products);
      }
    });
  }
}
