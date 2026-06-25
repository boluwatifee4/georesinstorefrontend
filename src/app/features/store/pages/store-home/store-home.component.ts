import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  computed,
  DestroyRef,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  throttleTime,
} from 'rxjs/operators';
import { fromEvent, animationFrameScheduler } from 'rxjs';
import { ProductsStore } from '../../state/products.store';
import { CategoriesStore } from '../../state/categories.store';
import { CartStore } from '../../state/cart.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';
import { SeoService } from '../../../../core/services/seo.service';


import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSparkles,
  lucideFlame,
  lucideShoppingBag,
  lucideTruck,
  lucideShieldCheck,
  lucideZap,
  lucideHeartHandshake,
} from '@ng-icons/lucide';


@Component({
  selector: 'app-store-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideSparkles,
      lucideFlame,
      lucideShoppingBag,
      lucideTruck,
      lucideShieldCheck,
      lucideZap,
      lucideHeartHandshake,
    }),
  ],
  templateUrl: './store-home.component.html',
  styleUrls: ['./store-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsStore = inject(ProductsStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly cartStore = inject(CartStore);
  private readonly googleDriveUtil = inject(GoogleDriveUtilService);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly search = new FormControl('');

  readonly categories = this.categoriesStore.categories;
  readonly loadingCategories = this.categoriesStore.loading;
  readonly products = this.productsStore.products;
  readonly loadingProducts = this.productsStore.loading;
  readonly productsError = this.productsStore.error;

  // Cart state
  readonly cartItemCount = this.cartStore.itemCount;
  readonly isAddingToCart = signal<{ [productId: number]: boolean }>({});

  // Featured products now loaded from dedicated endpoint
  readonly featuredProducts = this.productsStore.featured;

  readonly newProducts = computed(() => {
    const products = this.products();
    return products
      ? products
          .filter((p) => !p.featured)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 6)
      : [];
  });

  readonly topCategories = computed(() => {
    const categories = this.categories();
    return categories ? categories.slice(0, 8) : [];
  });

  // Header scroll state (transparent -> solid)
  readonly scrolled = signal(false);

  // Slideshow images computed from loaded products
  readonly newArrivalsImages = computed(() => {
    return this.newProducts()
      .map((p) => this.getImageUrl(p.primaryImageUrl || ''))
      .filter(Boolean);
  });

  readonly bestSellersImages = computed(() => {
    return this.featuredProducts()
      .map((p) => this.getImageUrl(p.primaryImageUrl || ''))
      .filter(Boolean);
  });

  readonly allProductsImages = computed(() => {
    return this.products()
      .map((p) => this.getImageUrl(p.primaryImageUrl || ''))
      .filter(Boolean);
  });

  // Active slide indices for slideshow promo tiles
  readonly newArrivalsIndex = signal(0);
  readonly bestSellersIndex = signal(0);
  readonly allProductsIndex = signal(0);

  // Category gradient palette for visual variety
  private readonly categoryGradients = [
    'from-violet-500 to-purple-600',
    'from-fuchsia-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-lime-500 to-green-600',
  ];

  constructor() {
    // effect(() => {
    //   console.log('Products changed:', this.products());
    // });
  }

  ngOnInit(): void {
    try {
      // Set comprehensive SEO for home page
      this.seo.setDefault({
        title:
          "Premium Epoxy Resin, UV Resin & Art Supplies - Nigeria's #1 Resin Store",
        description:
          "Shop premium epoxy resin, UV resin, pigments, molds and art supplies at Geo Resin Store. Nigeria's leading destination for resin crafting materials with fast nationwide delivery.",
        image: 'https://www.georesinstore.com/hero-bg.png',
        path: '/store',
      });

      // Set comprehensive keywords for home page
      this.seo.setKeywords([
        'resin materials Nigeria',
        'epoxy resin Lagos',
        'UV resin',
        'resin pigments',
        'resin molds',
        'resin art supplies',
        'craft materials Nigeria',
        'woodworking resin',
        'jewelry making supplies',
        'art materials Lagos',
        'epoxy resin store',
        'resin crafting supplies',
        'clear epoxy resin',
        'colored resin pigments',
        'silicone molds',
        'resin starter kit',
      ]);

      // Set local business structured data
      this.seo.setLocalBusinessStructuredData();

      // Set FAQ structured data for home page
      this.seo.setFAQStructuredData([
        {
          question: 'What types of resin do you sell?',
          answer:
            'We sell premium epoxy resin, UV resin, and specialized resin formulations for various applications including art, woodworking, and jewelry making.',
        },
        {
          question: 'Do you deliver nationwide in Nigeria?',
          answer:
            'Yes, we provide fast and reliable delivery to all states in Nigeria with secure packaging to ensure your materials arrive safely.',
        },
        {
          question: 'Are your resin materials suitable for beginners?',
          answer:
            'Absolutely! We offer starter kits and beginner-friendly products with detailed instructions to help you get started with resin crafting.',
        },
        {
          question: 'What payment methods do you accept?',
          answer:
            'We accept bank transfers, card payments, and mobile money payments for your convenience.',
        },
      ]);

      this.search.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((v) => {
          if ((v || '').trim().length > 2) {
            this.router.navigate(['/store/products'], {
              queryParams: { q: v?.trim() },
            });
          }
        });

      // Scroll listener for header style (guard for SSR)
      if (typeof window !== 'undefined') {
        fromEvent(window, 'scroll')
          .pipe(
            throttleTime(50, animationFrameScheduler, {
              leading: true,
              trailing: true,
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe(() => {
            const shouldBeSolid = window.scrollY > 40; // threshold
            if (shouldBeSolid !== this.scrolled()) {
              this.scrolled.set(shouldBeSolid);
            }
          });
      }

      // Load general products (could be paginated list) & featured list
      if (isPlatformBrowser(this.platformId)) {
        this.productsStore.loadProducts();
        this.productsStore.loadFeatured(8);
        this.categoriesStore.loadCategories();

        // Staggered promo tile slideshow transitions (every 1.5 seconds, update one card)
        let ticks = 0;
        const slideshowInterval = setInterval(() => {
          ticks++;
          
          if (ticks % 3 === 0) {
            const imgs = this.newArrivalsImages();
            if (imgs.length > 1) {
              this.newArrivalsIndex.update((idx) => (idx + 1) % imgs.length);
            }
          } else if (ticks % 3 === 1) {
            const imgs = this.bestSellersImages();
            if (imgs.length > 1) {
              this.bestSellersIndex.update((idx) => (idx + 1) % imgs.length);
            }
          } else if (ticks % 3 === 2) {
            const imgs = this.allProductsImages();
            if (imgs.length > 1) {
              this.allProductsIndex.update((idx) => (idx + 1) % imgs.length);
            }
          }
        }, 1500);

        this.destroyRef.onDestroy(() => {
          clearInterval(slideshowInterval);
        });
      }

      // Initialize cart
      this.cartStore.initializeCart();
    } catch (error) {
      console.error('StoreHomeComponent initialization failed:', error);
    }
  }

  goToProducts() {
    this.router.navigate(['/store/products']);
  }
  goToCart() {
    this.router.navigate(['/store/cart']);
  }
  goToHome() {
    this.router.navigate(['/store']);
  }
  goToOrderLookup() {
    this.router.navigate(['/store/orders/lookup']);
  }
  trackById(_: number, item: any) {
    return item?.id || item?.slug || item;
  }

  viewProduct(product: Product): void {
    // Navigate using product slug for SEO-friendly URLs
    this.router.navigate(['/store/products', product.slug]);
  }

  viewCategory(category: any): void {
    this.router.navigate(['/store/products'], {
      queryParams: { category: category.slug },
    });
  }

  quickAddToCart(product: Product, event?: Event): void {
    if (event) {
      event.stopPropagation(); // Prevent navigation to product detail
    }

    const productData = product as any;
    // If options or multiple variants, take user to detail for selection logic
    if (productData.optionGroups && productData.optionGroups.length > 0) {
      this.viewProduct(product);
      return;
    }

    // Flexible add to cart: simple product (may or may not expose variants)
    this.setProductAdding(product.id, true);

    // Initialize cart if needed
    if (!this.cartStore.cartId()) {
      this.cartStore.createCart();
      // Wait for cart creation then add item
      setTimeout(() => {
        this.cartStore.addItem({ productId: product.id, qty: 1 });
        this.setProductAdding(product.id, false);
        this.showAddToCartSuccess(product.title);
      }, 500);
    } else {
      this.cartStore.addItem({ productId: product.id, qty: 1 });
      this.setProductAdding(product.id, false);
      this.showAddToCartSuccess(product.title);
    }
  }

  private setProductAdding(productId: number, adding: boolean): void {
    this.isAddingToCart.update((state) => ({
      ...state,
      [productId]: adding,
    }));
  }

  isProductAdding(productId: number): boolean {
    return this.isAddingToCart()[productId] || false;
  }

  private showAddToCartSuccess(productTitle: string): void {
    // Simple success feedback - could be replaced with toast notification
    // For now, we'll use a simple alert but this should be a toast
    // console.log(`Added ${productTitle} to cart!`);
    // Optional: Show a brief success indicator
    // This could be enhanced with a proper toast notification system
  }

  retryLoadProducts() {
    this.productsStore.loadProducts({ limit: 24 });
  }

  /**
   * Process image URL through Google Drive converter if needed
   */
  getImageUrl(url: string): string {
    if (!url) return '';
    return this.googleDriveUtil.convertGoogleDriveUrl(url);
  }

  /**
   * Handle image loading errors with graceful fallback
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    const original = img.getAttribute('data-orig') || img.currentSrc || img.src;
    if (!img.dataset['fallbackIndex']) {
      img.dataset['fallbackIndex'] = '0';
      img.setAttribute('data-orig', original);
    }
    const fallbacks = this.googleDriveUtil.getFallbackImageUrls(original);
    const idx = parseInt(img.dataset['fallbackIndex']!, 10);
    if (idx < fallbacks.length) {
      img.src = fallbacks[idx];
      img.dataset['fallbackIndex'] = String(idx + 1);
    } else {
      img.style.display = 'none';
    }
  }

  scrollToNewArrivals(): void {
    const element = document.getElementById('new-arrivals');
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  onPromoTileClick(action: string): void {
    switch (action) {
      case 'new':
        this.scrollToNewArrivals();
        break;
      case 'featured':
        this.router.navigate(['/store/products'], {
          queryParams: { featured: true },
        });
        break;
      case 'products':
        this.goToProducts();
        break;
      case 'track':
        this.goToOrderLookup();
        break;
    }
  }

  getCategoryGradient(index: number): string {
    return this.categoryGradients[index % this.categoryGradients.length];
  }
}
