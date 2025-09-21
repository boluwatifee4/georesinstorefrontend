import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of, finalize } from 'rxjs';
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
    const prev = this._state().filters;
    const merged = { ...prev, ...filters };
    this.setFilters(merged);
    // If requesting the first page, reset the list before fetching
    if (!merged.page || merged.page === 1) {
      this._state.update(state => ({ ...state, products: [] }));
    }
    this.fetchProducts();
  }

  // Load more products without triggering global loading state
  loadMoreProducts(filters?: Partial<ProductFilters>) {
    const prev = this._state().filters;
    const merged = { ...prev, ...filters };
    this.setFilters(merged);
    // Don't reset products list and don't trigger global loading
    return this.fetchProductsQuietly();
  }

  reloadProducts() {
    this.fetchProducts();
  }

  loadProductBySlug(slug: string) {
    this.setLoading(true);
    this.productsService.getProductBySlug(slug).pipe(
      catchError(error => {
        this.setError('Unable to load product details. Please check your connection and try again.');
        return of(null);
      })
    ).subscribe(product => {
      if (product) {
        this.setCurrentProduct(product);
      }
      this.setLoading(false);
    });
  }

  // Accept product prefetched via resolver (no duplicate call)
  setPrefetchedProduct(product: Product) {
    if (!product) return;
    const current = this._state().currentProduct;
    if (!current || current.id !== product.id) {
      this._state.update(state => ({ ...state, currentProduct: product, error: null }));
    }
  }

  // Private state updaters
  private setProducts(products: Product[], append = false) {
    this._state.update(state => ({
      ...state,
      products: append ? [...state.products, ...products] : products,
      error: null
    }));
  }

  private setFeatured(products: Product[]) {
    this._state.update(state => ({ ...state, featured: products }));
  }

  private setCurrentProduct(product: Product) {
    this._state.update(state => ({ ...state, currentProduct: product, error: null }));
  }

  clearCurrentProduct() {
    this._state.update(state => ({ ...state, currentProduct: null }));
  }

  private setLoading(loading: boolean) {
    this._state.update(state => ({
      ...state,
      loading,
      // Clear error when starting to load
      error: loading ? null : state.error
    }));
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
    // Always reflect loading state (even for subsequent pages) so UI can react
    this.setLoading(true);
    this.productsService.getProducts(filters).pipe(
      catchError(error => {
        // User-friendly error message instead of technical details
        const message = 'Unable to load products right now. Please check your internet connection and try again.';
        this.setError(message);
        return of(null);
      }),
      finalize(() => this.setLoading(false))
    ).subscribe(response => {
      if (response) {
        const isAppend = (filters.page || 1) > 1;
        if (Array.isArray(response)) {
          this.setProducts(response as any as Product[], isAppend);
          const total = (response as any).length || 0;
          this.setPagination({ total, page: filters.page || 1, limit: filters.limit || total });
        } else {
          this.setProducts(response.data, isAppend);
          this.setPagination({
            total: response.total,
            page: response.page,
            limit: response.limit
          });
        }
      }
    });
  }

  // Fetch products without triggering global loading state (for pagination)
  private fetchProductsQuietly() {
    const filters = this._state().filters;
    // Don't set loading to true for quiet fetch
    return this.productsService.getProducts(filters).pipe(
      catchError(error => {
        const message = 'Unable to load more products. Please check your connection and try again.';
        this.setError(message);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        const isAppend = (filters.page || 1) > 1;
        if (Array.isArray(response)) {
          this.setProducts(response as any as Product[], isAppend);
          const total = (response as any).length || 0;
          this.setPagination({ total, page: filters.page || 1, limit: filters.limit || total });
        } else {
          this.setProducts(response.data, isAppend);
          this.setPagination({
            total: response.total,
            page: response.page,
            limit: response.limit
          });
        }
      }
    });
  }

  loadFeatured(limit?: number) {
    this.productsService.getFeaturedProducts(limit).pipe(
      catchError(error => {
        this.setError('Unable to load featured products. Please check your connection and try again.');
        return of(null);
      })
    ).subscribe(products => {
      if (products) {
        this.setFeatured(products);
      }
    });
  }
}
