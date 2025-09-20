import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, DestroyRef, PLATFORM_ID, Inject, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// Removed unused switchMap/of imports after resolver optimization
import { ProductsStore } from '../../state/products.store';
import { SeoService } from '../../../../core/services/seo.service';
import { CartStore } from '../../state/cart.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { Product } from '../../../../types/api.types';

// Type definitions for option groups from API response
interface ProductOption {
  id: number;
  value: string;
  priceModifier: number;
  inventory: number;
  isActive: boolean;
}

interface ProductOptionGroup {
  id: number;
  name: string;
  position: number;
  options: ProductOption[];
}

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
  private readonly seo = inject(SeoService);
  private readonly cartStore = inject(CartStore);
  private readonly googleDriveService = inject(GoogleDriveUtilService);

  // State
  readonly product = this.productsStore.currentProduct;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly selectedImageIndex = signal(0);
  readonly quantity = signal(1);
  readonly showImageModal = signal(false);
  readonly selectedOptions = signal<Record<number, ProductOption>>({}); // groupId -> selected option
  // Inline feedback (instead of window alert/confirm)
  readonly feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);
  readonly showPostAddActions = signal(false);
  readonly addInProgress = signal(false);

  // Computed properties
  readonly unitPrice = computed(() => {
    const product = this.product();
    if (!product) return 0;

    const selected = this.selectedOptions();
    const optionGroups = (product as any).optionGroups as ProductOptionGroup[] || [];

    // If there are option groups and at least one option is selected, use the option price
    if (optionGroups.length > 0) {
      const selectedValues = Object.values(selected);
      if (selectedValues.length > 0) {
        // Use the price from the selected option as the unit price
        return selectedValues[0]?.priceModifier || product.basePrice || 0;
      }
    }

    // No options or no selection, use base price as unit price
    return product.basePrice || 0;
  });

  readonly currentPrice = computed(() => {
    return this.unitPrice();
  });

  readonly totalPrice = computed(() => {
    return this.unitPrice() * this.quantity();
  });

  readonly isInStock = computed(() => {
    const product = this.product();
    if (!product) return false;

    const selected = this.selectedOptions();
    const optionGroups = (product as any).optionGroups as ProductOptionGroup[] || [];

    // Check if all required option groups have selections
    for (const group of optionGroups) {
      const selectedOption = selected[group.id];
      if (!selectedOption) return false; // No option selected for this group
      if (!selectedOption.isActive || selectedOption.inventory <= 0) return false;
    }

    return true;
  });

  readonly canAddToCart = computed(() => {
    const product = this.product();
    if (!product) return false;

    const optionGroups = (product as any).optionGroups as ProductOptionGroup[] || [];
    const selected = this.selectedOptions();

    // If there are option groups, all must be selected
    if (optionGroups.length > 0) {
      return optionGroups.every(group => selected[group.id]) && this.quantity() > 0;
    }

    return this.quantity() > 0;
  });

  readonly optionGroups = computed(() => {
    const product = this.product();
    if (!product) return [];
    return ((product as any).optionGroups as ProductOptionGroup[] || []).sort((a, b) => a.position - b.position);
  });

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

  readonly showLoading = computed(() => {
    // Show loading if global loading true OR (no product yet and no error)
    return this.loading() || (!this.product() && !this.error());
  });

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Auto-select first available option for each group when product loads
    effect(() => {
      const product = this.product();
      if (product && (product as any).optionGroups) {
        const optionGroups = (product as any).optionGroups as ProductOptionGroup[];
        const initialSelections: Record<number, ProductOption> = {};

        optionGroups.forEach(group => {
          const firstAvailableOption = group.options.find(opt => opt.isActive && opt.inventory > 0);
          if (firstAvailableOption) {
            initialSelections[group.id] = firstAvailableOption;
          }
        });

        if (Object.keys(initialSelections).length > 0) {
          this.selectedOptions.set(initialSelections);
        }
      }

      const p = this.product();
      if (p) this.applySeo(p);
    });
  }

  ngOnInit(): void {
    // Prefer resolver data if present to avoid duplicate HTTP
    const dataProduct = this.route.snapshot.data?.['product'] as Product | null;
    if (dataProduct) {
      // store already updated by resolver's tap
      this.applySeo(dataProduct);
      return;
    }
    // Fallback: if store empty and slug exists (direct client navigation without resolver for some reason)
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!this.product() && slug) {
      this.productsStore.loadProductBySlug(slug);
    } else if (this.product()) {
      this.applySeo(this.product()!);
    }
  }

  private applySeo(product: Product) {
    const title = product.title + ' | Geo Resin Store';
    const desc = product.description?.slice(0, 160) || 'Premium resin product';
    const img = product.primaryImageUrl ? this.googleDriveService.convertGoogleDriveUrl(product.primaryImageUrl) : undefined;
    const url = typeof location !== 'undefined' ? location.href : undefined;
    this.seo.setOg({ title, description: desc, image: img, url, type: 'product' });
    const price = product.basePrice || (product as any).minPrice;
    this.seo.setProductStructuredData({ title: product.title, description: product.description || undefined, image: img, price, currency: 'NGN', slug: product.slug || undefined });
  }

  // UI Methods
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  selectOption(groupId: number, option: ProductOption): void {
    this.selectedOptions.update(selected => ({
      ...selected,
      [groupId]: option
    }));
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
    const selected = this.selectedOptions();

    if (!product || !this.canAddToCart()) return;

    // For products with option groups, ensure all are selected
    const optionGroups = (product as any).optionGroups as ProductOptionGroup[] || [];
    if (optionGroups.length && !optionGroups.every(g => !!selected[g.id])) {
      this.showFeedback('error', 'Please select all required options before adding to cart.');
      return;
    }

    // Get variant ID - use first available variant, or create synthetic ID for simple products
    let variantId = this.getSelectedVariantId();

    // If no variant found but product exists, create a fallback
    if (!variantId) {
      const variants = (product as any).variants || [];
      if (variants.length > 0) {
        variantId = variants[0].id;
      } else {
        // For simple products without variants, use product ID as variant ID
        // This is a common pattern where the backend treats product.id as the default variant
        variantId = product.id;
      }
    }

    // At this point variantId should always be valid
    if (!variantId) {
      this.showFeedback('error', 'Unable to add product to cart. Please try again.');
      return;
    }

    // Build flexible DTO: only include variantId if real variants exist; only include selectedOptions if any selected
    const variants = (product as any).variants || [];
    const selectedOptionEntries = optionGroups.length
      ? Object.entries(selected).map(([gId, opt]) => [gId, (opt as any)?.id]).filter(([_, id]) => !!id)
      : [];

    // If product truly has no variants, ignore the earlier fallback variantId (which may equal product.id)
    const hasRealVariants = variants.length > 0;
    if (!hasRealVariants) {
      variantId = null; // prevent sending synthetic id as variantId
    }

    const dto: any = {
      productId: product.id,
      qty
    };
    if (hasRealVariants && variantId) {
      dto.variantId = variantId;
    }
    if (selectedOptionEntries.length > 0) {
      dto.selectedOptions = Object.fromEntries(selectedOptionEntries);
    }

    // Initialize cart if needed and add item (flexible DTO) using new callback pattern
    this.addInProgress.set(true);
    const finish = (success: boolean) => {
      this.addInProgress.set(false);
      if (success) {
        this.finalizeAddToCart(variantId, product, qty, selected);
      } else {
        this.showFeedback('error', 'Failed to add to cart. Please try again.');
      }
    };

    if (!this.cartStore.cartId()) {
      this.cartStore.createCart(() => {
        this.cartStore.addItem(dto, undefined, finish);
      });
    } else {
      this.cartStore.addItem(dto, undefined, finish);
    }
  }

  private getSelectedVariantId(): number | null {
    const product = this.product();
    if (!product) return null;
    const variants = (product as any).variants || [];
    const selected = this.selectedOptions();
    const optionGroups = (product as any).optionGroups as ProductOptionGroup[] || [];

    // No variants available at all
    if (!variants.length) return null;

    // Single variant shortcut (covers simple product and most fallback cases)
    if (variants.length === 1 && (!optionGroups.length)) {
      return variants[0].id;
    }

    // No option groups: fallback to first variant
    if (!optionGroups.length) {
      return variants[0]?.id ?? null; // Multi-variant but no options exposed – pick first.
    }

    // All selected option ids (sorted for deterministic comparison)
    const selectedOptionIds = optionGroups
      .map(g => selected[g.id]?.id)
      .filter(id => !!id) // remove undefined
      .map(Number)
      .sort((a, b) => a - b);

    if (selectedOptionIds.length !== optionGroups.length) {
      return null; // Missing selections
    }

    // Detect if backend includes combination metadata
    const anyHasCombinations = variants.some((v: any) => Array.isArray(v.optionCombination) && v.optionCombination.length);

    if (anyHasCombinations) {
      // Strict exact-match pass
      for (const variant of variants) {
        const combo = (variant.optionCombination || []).map((oc: any) => Number(oc.option.id)).sort((a: number, b: number) => a - b);
        if (
          combo.length === selectedOptionIds.length &&
          combo.every((id: number, idx: number) => id === selectedOptionIds[idx])
        ) {
          return variant.id;
        }
      }
      // Relaxed superset match (if variant combo is a superset including all selected)
      for (const variant of variants) {
        const combo = (variant.optionCombination || []).map((oc: any) => Number(oc.option.id));
        if (selectedOptionIds.every(id => combo.includes(id))) {
          return variant.id;
        }
      }
    } else {
      // No combination metadata at all: attempt heuristic by price match
      const current = this.currentPrice();
      const priceMatched = variants.find((v: any) => parseFloat(v.price) === current);
      if (priceMatched) return priceMatched.id;
      // Fallback to first variant
      return variants[0]?.id ?? null;
    }

    // Final fallback: allow default variant to keep UX smooth
    return variants[0]?.id ?? null;
  }

  private finalizeAddToCart(variantId: number | null, product: any, qty: number, selected: Record<number, ProductOption>) {
    const optionDetails = Object.values(selected).map(opt => opt.value).join(', ');
    const message = optionDetails
      ? `Added ${qty} × ${product.title} (${optionDetails}) – ₦${this.totalPrice().toLocaleString('en-NG')}`
      : `Added ${qty} × ${product.title} – ₦${this.totalPrice().toLocaleString('en-NG')}`;

    // Reset quantity & show inline feedback/actions
    this.quantity.set(1);
    this.showFeedback('success', message);
    this.showPostAddActions.set(true);

    // Auto-hide feedback after 6s (actions panel stays until another add or navigation)
    setTimeout(() => {
      if (this.feedback()) {
        this.feedback.set(null);
      }
    }, 6000);
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

  // Feedback helpers
  private showFeedback(type: 'success' | 'error', message: string) {
    this.feedback.set({ type, message });
  }

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  goToCart(): void {
    this.router.navigate(['/store/cart']);
  }

  continueShoppingInline(): void {
    this.showPostAddActions.set(false);
  }
}
