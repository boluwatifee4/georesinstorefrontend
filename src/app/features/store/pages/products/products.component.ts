import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
  Inject,
  effect,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  isPlatformBrowser,
} from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  take,
} from 'rxjs/operators';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly productsStore = inject(ProductsStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly googleDriveService = inject(GoogleDriveUtilService);
  private readonly seo = inject(SeoService);
  private readonly notificationsApi = inject(PublicNotificationsService);

  @ViewChildren('productCard') productCards!: QueryList<ElementRef>;
  private scrollObserver: IntersectionObserver | null = null;

  // State
  readonly products = this.productsStore.products;
  readonly categories = this.categoriesStore.categories;
  readonly loadingProducts = this.productsStore.loading;
  readonly loadingCategories = this.categoriesStore.loading;
  readonly productsError = this.productsStore.error;
  readonly showFilters = signal(false);
  readonly firstLoadCalled = signal(false);
  readonly initialLoadDone = computed(() => {
    if (!this.firstLoadCalled()) return false;
    if (this.loadingProducts()) return false;
    return true;
  });
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

  get categoryControl(): FormControl {
    return this.filterForm.get('category') as FormControl;
  }

  get sortByControl(): FormControl {
    return this.filterForm.get('sortBy') as FormControl;
  }

  // Computed properties
  readonly filteredProducts = computed(() => {
    const products = this.products();
    const filters = this.filterForm.value;

    if (!products) return [];

    let result = products.filter((product) => {
      // Search filter
      if (
        filters.search &&
        !product.title.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Category filter (match by slug)
      if (filters.category) {
        const match = product.categories?.some(
          (c) => c.slug === filters.category,
        );
        if (!match) return false;
      }

      // Active filter
      if (filters.isActive !== null && product.isActive !== filters.isActive) {
        return false;
      }

      return true;
    });

    // Client-side sorting
    if (filters.sortBy) {
      result = [...result].sort((a, b) => {
        const aPrice = a.basePrice ?? a.minPrice ?? 0;
        const bPrice = b.basePrice ?? b.minPrice ?? 0;

        switch (filters.sortBy) {
          case 'price-low':
            return aPrice - bPrice;
          case 'price-high':
            return bPrice - aPrice;
          case 'name':
            return a.title.localeCompare(b.title);
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
    }

    return result;
  });

  readonly totalProducts = computed(() => this.filteredProducts().length);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.filterForm = this.fb.group({
      search: [''],
      category: [''],
      isActive: [null],
      sortBy: ['newest'], // newest, oldest, price-low, price-high, name
    });

    this.requestForm = this.fb.group({
      phone: [
        '',
        [Validators.required, Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)],
      ],
      request: ['', [Validators.required, Validators.minLength(10)]],
    });

    // Reactive SEO updates based on filters/search
    effect(() => {
      const filters = this.filterForm.value;
      const parts: string[] = [];
      if (filters.search) parts.push(`Search: "${filters.search}"`);
      if (filters.category) parts.push(`Category: ${filters.category}`);
      const titleBase = parts.length
        ? `${parts.join(' • ')} Products`
        : 'Premium Resin Materials & Art Supplies';
      const desc = parts.length
        ? `Browse ${parts.join(
            ', ',
          )} products. Quality resin materials, pigments, molds and tools with fast delivery across Nigeria.`
        : "Browse premium epoxy resin, UV resin, pigments, molds and art supplies. Nigeria's largest selection of quality resin materials with expert support.";

      this.seo.setDefault({
        title: titleBase,
        description: desc,
        image: 'https://www.georesinstore.com/hero-bg1.png',
        path: '/store/products',
      });

      // Set relevant keywords based on filters
      const keywords = [
        'resin materials Nigeria',
        'epoxy resin products',
        'UV resin supplies',
        'resin pigments Nigeria',
        'resin molds',
        'art supplies Lagos',
      ];

      if (filters.category) {
        keywords.push(
          `${filters.category} Nigeria`,
          `${filters.category} Lagos`,
        );
      }
      if (filters.search) {
        keywords.push(`${filters.search} Nigeria`, `${filters.search} resin`);
      }

      this.seo.setKeywords(keywords);

      // Set breadcrumb structured data
      const breadcrumbs = [
        { name: 'Home', url: 'https://www.georesinstore.com/' },
        { name: 'Store', url: 'https://www.georesinstore.com/store' },
        {
          name: 'Products',
          url: 'https://www.georesinstore.com/store/products',
        },
      ];

      if (filters.category) {
        breadcrumbs.push({
          name: filters.category,
          url: `https://www.georesinstore.com/store/products?category=${encodeURIComponent(
            filters.category,
          )}`,
        });
      }

      this.seo.setBreadcrumbStructuredData(breadcrumbs);
    });

    this.destroyRef.onDestroy(() => {
      if (this.scrollObserver) {
        this.scrollObserver.disconnect();
      }
    });
  }

  ngOnInit(): void {
    this.setupFilterHandling();
    this.handleQueryParams();
    if (isPlatformBrowser(this.platformId)) {
      this.firstLoadCalled.set(true);
      if (this.categoriesStore.categories().length === 0) {
        this.categoriesStore.loadCategories();
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.productCards.changes
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.updateSentinelObserver();
        });
      // Initial setup
      this.updateSentinelObserver();
    }
  }

  private updateSentinelObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }

    if (!this.hasMoreData() || this.loadingProducts() || this.loadingMore()) {
      return;
    }

    const cardsArray = this.productCards.toArray();
    const len = cardsArray.length;
    if (len === 0) return;

    // Calculate sentinel index: 60% of loaded products (beyond the middle)
    const sentinelIndex = Math.floor(len * 0.6);
    const sentinelCard = cardsArray[sentinelIndex];

    if (sentinelCard) {
      this.scrollObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            if (this.scrollObserver) {
              this.scrollObserver.disconnect();
            }
            this.loadMoreProducts();
          }
        },
        {
          root: null,
          threshold: 0.1,
        }
      );
      this.scrollObserver.observe(sentinelCard.nativeElement);
    }
  }

  // Initial data is now smartly loaded within handleQueryParams and ngOnInit to avoid double-fetching

  private setupFilterHandling(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // Removed scroll detection; users will click a Load More button instead

  private handleQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const current = this.filterForm.value;
        const next: any = {};
        let changed = false;

        const targetSearch = params['q'] || '';
        if (current.search !== targetSearch) {
          next.search = targetSearch;
          changed = true;
        }

        const targetCategory = params['category'] || '';
        if (current.category !== targetCategory) {
          next.category = targetCategory;
          changed = true;
        }

        if (params['isActive'] !== undefined) {
          const boolVal = params['isActive'] === 'true';
          if (current.isActive !== boolVal) {
            next.isActive = boolVal;
            changed = true;
          }
        }

        if (changed) {
          this.filterForm.patchValue(next, { emitEvent: false }); // avoid bouncing back into applyFilters
        }

        // Smart pre-fetch reuse: Calculate target filters from URL and compare with store
        // We explicitly pass undefined for absent filters to overwrite any previous search/category filters in the store state merge.
        const apiFilters: any = {
          page: 1,
          limit: 20,
          q: params['q'] || undefined,
          category: params['category'] || undefined
        };
        
        if (isPlatformBrowser(this.platformId)) {
          const currentStoreFilters = this.productsStore.filters();
          const hasProducts = this.productsStore.hasProducts();
          
          // Only fetch if filters differ from what's in the store OR if we have no products
          const filtersDiffer = currentStoreFilters.q !== apiFilters.q || currentStoreFilters.category !== apiFilters.category;
          
          if (!hasProducts || filtersDiffer) {
            this.productsStore.loadProducts(apiFilters);
          }
        }
      });
  }

  private applyFilters(): void {
    // Update URL with current filters
    const filters = this.filterForm.value;
    const queryParams: any = {};

    // Explicitly pass null for empty filters to clear them from URL query params
    queryParams.q = filters.search?.trim() || null;
    queryParams.category = filters.category || null;
    if (filters.isActive !== null) queryParams.isActive = filters.isActive;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });

    // Do not call loadProducts directly here; queryParams subscription will trigger the fetch (prevents duplicate calls)
  }

  private loadMoreProducts(): void {
    if (!this.hasMoreData() || this.loadingMore()) return;

    const { page, limit } = this.productsStore.pagination();
    const nextPage = (page || 1) + 1;

    this.loadingMore.set(true);

    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }

    // Load products with current filters using the quiet method
    const currentFilters = this.filterForm.value;
    const apiFilters: any = { page: nextPage, limit: limit || 20 };

    // Add current filters to the API call
    if (currentFilters.search) apiFilters.q = currentFilters.search;
    if (currentFilters.category) apiFilters.category = currentFilters.category;
    if (currentFilters.isActive !== null)
      apiFilters.isActive = currentFilters.isActive;

    // Use the new loadMoreProducts method that doesn't trigger global loading
    const subscription = this.productsStore.loadMoreProducts(apiFilters);

    if (subscription) {
      subscription.add(() => {
        this.loadingMore.set(false);
        this.updateSentinelObserver();
      });
    } else {
      // Fallback timeout
      setTimeout(() => {
        this.loadingMore.set(false);
        this.updateSentinelObserver();
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

    // Avoid the button stealing focus
    const target = event?.currentTarget as HTMLElement | undefined;
    if (target) {
      target.blur();
    }

    if (this.loadingMore() || !this.hasMoreData()) return;

    this.loadMoreProducts();
  }

  // UI Methods
  readonly selectedCategoryName = computed(() => {
    const slug = this.filterForm.get('category')?.value;
    if (!slug) return '';
    const cat = this.categories().find((c: any) => c.slug === slug);
    return cat ? cat.name : slug;
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.filterForm.value;
    return !!(
      filters.search?.trim() ||
      filters.category
    );
  });

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      category: '',
      isActive: null,
      sortBy: 'newest',
    });
  }

  clearSearch(): void {
    this.filterForm.patchValue({ search: '' });
  }

  clearCategory(): void {
    this.filterForm.patchValue({ category: '' });
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  sortProducts(sortBy: string): void {
    this.filterForm.patchValue({ sortBy });
  }

  addToCart(productId: string | number): void {
    // For products listing, it's better to navigate to product detail
    // where users can select specific variants/options
    const product = this.filteredProducts().find((p) => p.id === productId);
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

  isProductAvailable(product: Product): boolean {
    // If we have detailed option info, trust that over the simple isEmpty flag
    // This aligns logic with ProductDetailComponent to prevent "Out of Stock" discrepancies
    if (product.optionGroups && product.optionGroups.length > 0) {
      // Check if all option groups have at least one valid option available
      // (e.g. Needs at least one available Size AND at least one available Color)
      return product.optionGroups.every((group) =>
        group.options?.some((opt) => opt.isActive && opt.inventory > 0),
      );
    }

    // Fallback to server-provided flag
    return !product.isEmpty;
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
      'Action: Contact customer about requested product availability.',
    ].join('\n');

    this.notificationsApi.sendTelegram(message).subscribe({
      next: () => {
        // console.log('Product request telegram notification sent');
        toast.success(
          "Request submitted! We'll contact you soon about product availability.",
          { duration: 4000 },
        );
        this.hideProductRequestForm();
        this.submittingRequest.set(false);
      },
      error: (err) => {
        console.error('Failed to send product request telegram:', err);
        toast.error('Failed to submit request. Please try again.');
        this.submittingRequest.set(false);
      },
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
          case 'phone':
            return 'Phone number is required';
          case 'request':
            return 'Product request is required';
          default:
            return 'This field is required';
        }
      }
      if (field.errors?.['minlength'])
        return 'Please provide more details (at least 10 characters)';
      if (field.errors?.['pattern']) return 'Please enter a valid phone number';
    }
    return null;
  }
}
