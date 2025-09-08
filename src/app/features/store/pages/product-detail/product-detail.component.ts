import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, DestroyRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProductsStore } from '../../state/products.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productsStore = inject(ProductsStore);
  private readonly googleDriveService = inject(GoogleDriveUtilService);

  // State
  readonly product = this.productsStore.currentProduct;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly selectedImageIndex = signal(0);
  readonly quantity = signal(1);
  readonly showImageModal = signal(false);

  // Computed properties
  readonly currentPrice = computed(() => this.product()?.basePrice || 0);
  readonly isInStock = computed(() => true); // TODO: Add stock logic when variants are implemented
  readonly canAddToCart = computed(() => this.quantity() > 0);

  readonly allImages = computed(() => {
    const product = this.product();
    if (!product) return [];

    const images: string[] = [];

    // Add primary image first
    if (product.primaryImageUrl) {
      images.push(product.primaryImageUrl);
    }

    // TODO: Add media images when media field is available
    product.media?.forEach(m => {
      if (!images.includes(m.url)) {
        images.push(m.url);
      }
    });

    return images;
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    this.loadProduct();
  }

  private loadProduct(): void {
    this.route.params
      .pipe(
        switchMap(params => {
          const slug = params['slug'];
          if (!slug) {
            return of(null);
          }
          // Use the products store to load product by slug
          this.productsStore.loadProductBySlug(slug);
          return of(slug);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // UI Methods
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  openImageModal(): void {
    this.showImageModal.set(true);
  }

  closeImageModal(): void {
    this.showImageModal.set(false);
  }

  incrementQuantity(): void {
    const current = this.quantity();
    this.quantity.set(current + 1);
  }

  decrementQuantity(): void {
    const current = this.quantity();
    if (current > 1) {
      this.quantity.set(current - 1);
    }
  }

  addToCart(): void {
    const product = this.product();
    const qty = this.quantity();

    if (!product || !this.canAddToCart()) return;

    // TODO: Implement actual add to cart functionality
    console.log('Adding to cart:', {
      productId: product.id,
      quantity: qty,
      price: product.basePrice
    });

    // Show success feedback
    alert(`Added ${qty} x ${product.title} to cart!`);
  }

  goBack(): void {
    this.router.navigate(['/store/products']);
  }

  getImageUrl(url: string): string {
    return this.googleDriveService.convertGoogleDriveUrl(url);
  }

  onImageError(event: any): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    const original = img.getAttribute('data-orig') || img.currentSrc || img.src;
    if (!img.dataset['fallbackIndex']) {
      img.dataset['fallbackIndex'] = '0';
      img.setAttribute('data-orig', original);
    }
    const fallbacks = this.googleDriveService.getFallbackImageUrls(original);
    const idx = parseInt(img.dataset['fallbackIndex']!, 10);
    if (idx < fallbacks.length) {
      img.src = fallbacks[idx];
      img.dataset['fallbackIndex'] = String(idx + 1);
    } else {
      img.style.display = 'none';
    }
  }

  trackById(index: number, item: any): string {
    return String(item.id);
  }
}
