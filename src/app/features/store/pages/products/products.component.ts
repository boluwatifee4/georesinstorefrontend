import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, DestroyRef, PLATFORM_ID, Inject, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter, take } from 'rxjs/operators';
import { ProductsStore } from '../../state/products.store';
import { CategoriesStore } from '../../state/categories.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';
import { SeoService } from '../../../../core/services/seo.service';
import { PublicNotificationsService } from '../../../../api/public/notifications/notifications.service';
import { toast } from 'ngx-sonner';

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
  private readonly seo = inject(SeoService);
  private readonly notificationsApi = inject(PublicNotificationsService);

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

  // Product request form state
  readonly showRequestForm = signal(false);
  readonly submittingRequest = signal(false);
  readonly requestForm: FormGroup;

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

    this.requestForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)]],
      request: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Reactive SEO updates based on filters/search
    effect(() => {
      const filters = this.filterForm.value;
      const parts: string[] = [];
      if (filters.search) parts.push(`Search: "${filters.search}"`);
      if (filters.category) parts.push(`Category: ${filters.category}`);
      const titleBase = parts.length ? `${parts.join(' • ')} Products` : 'Premium Resin Materials & Art Supplies';
      const desc = parts.length
        ? `Browse ${parts.join(', ')} products. Quality resin materials, pigments, molds and tools with fast delivery across Nigeria.`
        : 'Browse premium epoxy resin, UV resin, pigments, molds and art supplies. Nigeria\'s largest selection of quality resin materials with expert support.';

      this.seo.setDefault({
        title: titleBase,
        description: desc,
        image: 'https://www.georesinstore.com/hero-bg1.png',
        path: '/store/products'
      });

      // Set relevant keywords based on filters
      const keywords = [
        'resin materials Nigeria',
        'epoxy resin products',
        'UV resin supplies',
        'resin pigments Nigeria',
        'resin molds',
        'art supplies Lagos'
      ];

      if (filters.category) {
        keywords.push(`${filters.category} Nigeria`, `${filters.category} Lagos`);
      }
      if (filters.search) {
        keywords.push(`${filters.search} Nigeria`, `${filters.search} resin`);
      }

      this.seo.setKeywords(keywords);

      // Set breadcrumb structured data
      const breadcrumbs = [
        { name: 'Home', url: 'https://www.georesinstore.com/' },
        { name: 'Store', url: 'https://www.georesinstore.com/store' },
        { name: 'Products', url: 'https://www.georesinstore.com/store/products' }
      ];

      if (filters.category) {
        breadcrumbs.push({
          name: filters.category,
          url: `https://www.georesinstore.com/store/products?category=${encodeURIComponent(filters.category)}`
        });
      }

      this.seo.setBreadcrumbStructuredData(breadcrumbs);
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
    if (!this.hasMoreData() || this.loadingMore()) return;

    const { page, limit } = this.productsStore.pagination();
    const nextPage = (page || 1) + 1;

    this.loadingMore.set(true);

    // Store current scroll position to prevent jumping
    const currentScrollY = isPlatformBrowser(this.platformId) ? window.scrollY : 0;

    // Load products with current filters using the quiet method
    const currentFilters = this.filterForm.value;
    const apiFilters: any = { page: nextPage, limit: limit || 20 };

    // Add current filters to the API call
    if (currentFilters.search) apiFilters.q = currentFilters.search;
    if (currentFilters.category) apiFilters.category = currentFilters.category;
    if (currentFilters.isActive !== null) apiFilters.isActive = currentFilters.isActive;

    // Use the new loadMoreProducts method that doesn't trigger global loading
    const subscription = this.productsStore.loadMoreProducts(apiFilters);

    if (subscription) {
      subscription.add(() => {
        this.loadingMore.set(false);

        // Restore scroll position to prevent jumping
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            window.scrollTo(0, currentScrollY);
          }, 50);
        }
      });
    } else {
      // Fallback timeout
      setTimeout(() => {
        this.loadingMore.set(false);

        // Restore scroll position to prevent jumping
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            window.scrollTo(0, currentScrollY);
          }, 50);
        }
      }, 2000);
    }
  }

  // Expose for template button
  onLoadMore(event?: Event): void {
    // Prevent default behavior and stop event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    // Avoid the button stealing focus and changing scroll position
    const target = event?.currentTarget as HTMLElement | undefined;
    if (target) {
      target.blur();
    }

    if (this.loadingMore() || !this.hasMoreData()) return;

    // Store current scroll position before loading
    if (isPlatformBrowser(this.platformId)) {
      const currentScrollY = window.scrollY;
      // Smooth scroll adjustment to account for new content
      setTimeout(() => {
        if (window.scrollY !== currentScrollY) {
          window.scrollTo({
            top: currentScrollY,
            behavior: 'auto'
          });
        }
      }, 100);
    }

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

  // Product request methods
  showProductRequestForm(): void {
    this.showRequestForm.set(true);
  }

  hideProductRequestForm(): void {
    this.showRequestForm.set(false);
    this.requestForm.reset();
  }

  submitProductRequest(): void {
    if (this.requestForm.invalid || this.submittingRequest()) return;

    this.submittingRequest.set(true);

    const formValue = this.requestForm.value;
    const now = new Date();

    // Compose admin-facing Telegram message payload
    const message = [
      '🛍️ Product Request',
      '',
      `• Phone: ${formValue.phone}`,
      `• Request: ${formValue.request}`,
      `• Timestamp: ${now.toLocaleString()}`,
      '',
      'Action: Contact customer about requested product availability.'
    ].join('\n');

    this.notificationsApi.sendTelegram(message).subscribe({
      next: () => {
        // console.log('Product request telegram notification sent');
        toast.success('Request submitted! We\'ll contact you soon about product availability.', { duration: 4000 });
        this.hideProductRequestForm();
        this.submittingRequest.set(false);
      },
      error: (err) => {
        console.error('Failed to send product request telegram:', err);
        toast.error('Failed to submit request. Please try again.');
        this.submittingRequest.set(false);
      }
    });
  }

  isRequestFormFieldInvalid(fieldName: string): boolean {
    const field = this.requestForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getRequestFormFieldError(fieldName: string): string | null {
    const field = this.requestForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        switch (fieldName) {
          case 'phone': return 'Phone number is required';
          case 'request': return 'Product request is required';
          default: return 'This field is required';
        }
      }
      if (field.errors?.['minlength']) return 'Please provide more details (at least 10 characters)';
      if (field.errors?.['pattern']) return 'Please enter a valid phone number';
    }
    return null;
  }
}
