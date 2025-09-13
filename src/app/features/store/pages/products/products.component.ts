import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, DestroyRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { ProductsStore } from '../../state/products.store';
import { CategoriesStore } from '../../state/categories.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly productsStore = inject(ProductsStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly googleDriveService = inject(GoogleDriveUtilService);

  // State
  readonly products = this.productsStore.products;
  readonly categories = this.categoriesStore.categories;
  readonly loadingProducts = this.productsStore.loading;
  readonly loadingCategories = this.categoriesStore.loading;
  readonly productsError = this.productsStore.error;
  readonly showFilters = signal(false);
  // Pagination from store
  readonly hasMoreData = this.productsStore.hasMore;
  readonly loadingMore = signal(false);

  // Filter form
  readonly filterForm: FormGroup;

  // Expose individual controls as strongly typed FormControls for template binding
  get searchControl(): FormControl {
    return this.filterForm.get('search') as FormControl;
  }

  get sortByControl(): FormControl {
    return this.filterForm.get('sortBy') as FormControl;
  }

  // Computed properties
  readonly filteredProducts = computed(() => {
    const products = this.products();
    const filters = this.filterForm.value;

    if (!products) return [];

    return products.filter(product => {
      // Search filter
      if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter (match by slug)
      if (filters.category) {
        const match = product.categories?.some(c => c.slug === filters.category);
        if (!match) return false;
      }

      // Active filter
      if (filters.isActive !== null && product.isActive !== filters.isActive) {
        return false;
      }

      // Price range filter
      const effectiveMin = product.minPrice ?? product.basePrice ?? 0;
      const effectiveMax = product.maxPrice ?? product.basePrice ?? effectiveMin;

      if (filters.minPrice && effectiveMin < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && effectiveMax > filters.maxPrice) {
        return false;
      }

      return true;
    });
  });

  readonly totalProducts = computed(() => this.filteredProducts().length);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      isActive: [null],
      minPrice: [null],
      maxPrice: [null],
      sortBy: ['newest'] // newest, oldest, price-low, price-high, name
    });
  }

  ngOnInit(): void {
    this.setupFilterHandling();
    this.handleQueryParams();
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load products and categories
    this.productsStore.loadProducts({ page: 1, limit: 20 });
    this.categoriesStore.loadCategories();
  }

  private setupFilterHandling(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // Removed scroll detection; users will click a Load More button instead

  private handleQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const current = this.filterForm.value;
        const next: any = {};
        let changed = false;
        if (params['q'] !== undefined && current.search !== params['q']) { next.search = params['q']; changed = true; }
        if (params['category'] !== undefined && current.category !== params['category']) { next.category = params['category']; changed = true; }
        if (params['isActive'] !== undefined) {
          const boolVal = params['isActive'] === 'true';
          if (current.isActive !== boolVal) { next.isActive = boolVal; changed = true; }
        }
        if (changed) {
          this.filterForm.patchValue(next, { emitEvent: false }); // avoid bouncing back into applyFilters
        }

        // If category (or search) present in URL, load products directly with those filters to avoid fetching full list first
        const filtersInUrl: any = {};
        if (params['category']) filtersInUrl.category = params['category'];
        if (params['q']) filtersInUrl.q = params['q'];
        if (Object.keys(filtersInUrl).length) {
          this.productsStore.loadProducts({ page: 1, limit: 20, ...filtersInUrl });
        }
      });
  }

  private applyFilters(): void {
    // Update URL with current filters
    const filters = this.filterForm.value;
    const queryParams: any = {};

    if (filters.search) queryParams.q = filters.search;
    if (filters.category) queryParams.category = filters.category;
    if (filters.isActive !== null) queryParams.isActive = filters.isActive;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });

    // Do not call loadProducts directly here; queryParams subscription will trigger the fetch (prevents duplicate calls)
  }

  private loadMoreProducts(): void {
    if (!this.hasMoreData()) return;
    const { page, limit } = this.productsStore.pagination();
    const nextPage = (page || 1) + 1;
    this.loadingMore.set(true);
    this.productsStore.loadProducts({ page: nextPage, limit });
    // Automatically clear when global loading ends
    toObservable(this.productsStore.loading)
      .pipe(
        filter(l => !l),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadingMore.set(false));
  }

  // Expose for template button
  onLoadMore(event?: Event): void {
    // Avoid the button stealing focus and changing scroll position
    const target = event?.currentTarget as HTMLElement | undefined;
    target?.blur?.();
    if (this.loadingMore() || !this.hasMoreData()) return;
    this.loadMoreProducts();
  }

  // UI Methods
  toggleFilters(): void {
    this.showFilters.update(show => !show);
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      isActive: null,
      minPrice: null,
      maxPrice: null,
      sortBy: 'newest'
    });
  }

  sortProducts(sortBy: string): void {
    this.filterForm.patchValue({ sortBy });
  }

  addToCart(productId: string | number): void {
    // For products listing, it's better to navigate to product detail
    // where users can select specific variants/options
    const product = this.filteredProducts().find(p => p.id === productId);
    if (product) {
      this.router.navigate(['/store/products', product.slug]);
    }
  }

  viewProduct(product: Product): void {
    // Navigate using product slug for SEO-friendly URLs
    this.router.navigate(['/store/products', product.slug]);
  }

  getImageUrl(url: string): string {
    return this.googleDriveService.convertGoogleDriveUrl(url);
  }

  onImageError(event: any): void {
    const el: HTMLImageElement = event.target as HTMLImageElement;
    const original = el.getAttribute('data-orig') || el.currentSrc || el.src;
    if (!el.dataset['fallbackIndex']) {
      el.dataset['fallbackIndex'] = '0';
      el.setAttribute('data-orig', original);
    }
    const fallbacks = this.googleDriveService.getFallbackImageUrls(original);
    const idx = parseInt(el.dataset['fallbackIndex']!, 10);
    if (idx < fallbacks.length) {
      el.src = fallbacks[idx];
      el.dataset['fallbackIndex'] = String(idx + 1);
    } else {
      // All fallbacks exhausted -> hide container gracefully
      el.style.display = 'none';
    }
  }

  trackById(index: number, item: any): string {
    return String(item.id);
  }

  retryLoadProducts(): void {
    this.productsStore.loadProducts();
  }
}
