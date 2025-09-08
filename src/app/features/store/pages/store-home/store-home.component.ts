import { ChangeDetectionStrategy, Component, OnInit, inject, computed, DestroyRef, signal, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, throttleTime } from 'rxjs/operators';
import { fromEvent, animationFrameScheduler } from 'rxjs';
import { ProductsStore } from '../../state/products.store';
import { CategoriesStore } from '../../state/categories.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-store-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './store-home.component.html',
  styleUrls: ['./store-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsStore = inject(ProductsStore);
  private readonly categoriesStore = inject(CategoriesStore);
  private readonly googleDriveUtil = inject(GoogleDriveUtilService);

  readonly search = new FormControl('');

  readonly categories = this.categoriesStore.categories;
  readonly loadingCategories = this.categoriesStore.loading;
  readonly products = this.productsStore.products;
  readonly loadingProducts = this.productsStore.loading;
  readonly productsError = this.productsStore.error;

  readonly featuredProducts = computed(() => {
    const products = this.products();
    return products ? products.filter(p => p.featured) : [];
  });

  readonly newProducts = computed(() => {
    const products = this.products();
    return products ? products.slice(6, 12) : [];
  });

  // Header scroll state (transparent -> solid)
  readonly scrolled = signal(false);

  constructor() {
    // effect(() => {
    //   console.log('Products changed:', this.products());
    // });
  }

  ngOnInit(): void {


    this.search.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v => {
      if ((v || '').trim().length > 2) {
        this.router.navigate(['/store/products'], { queryParams: { q: v?.trim() } });
      }
    });

    // Scroll listener for header style (guard for SSR)
    if (typeof window !== 'undefined') {
      fromEvent(window, 'scroll').pipe(
        throttleTime(50, animationFrameScheduler, { leading: true, trailing: true }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        const shouldBeSolid = window.scrollY > 40; // threshold
        if (shouldBeSolid !== this.scrolled()) {
          this.scrolled.set(shouldBeSolid);
        }
      });
    }

    this.productsStore.loadProducts();

    this.categoriesStore.loadCategories();
  }

  goToProducts() { this.router.navigate(['/store/products']); }
  goToCart() { this.router.navigate(['/store/cart']); }
  goToHome() { this.router.navigate(['/store']); }
  trackById(_: number, item: any) { return item.id || item.slug; }

  viewProduct(product: Product): void {
    // Navigate using product slug for SEO-friendly URLs
    this.router.navigate(['/store/products', product.slug]);
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

}
