import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { CartItem } from '../../../../types/api.types';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly router = inject(Router);
  private readonly googleDriveService = inject(GoogleDriveUtilService);

  // Cart state
  readonly cartItems = this.cartStore.items;
  readonly itemCount = this.cartStore.itemCount;
  readonly subtotal = this.cartStore.subtotal;
  readonly loading = this.cartStore.loading;
  readonly error = this.cartStore.error;

  // UI state
  readonly isUpdating = signal<{ [itemId: number]: boolean }>({});

  // Computed properties
  readonly isEmpty = computed(() => this.cartItems().length === 0);
  readonly formattedSubtotal = computed(() =>
    `₦${this.subtotal().toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  );

  ngOnInit(): void {
    // Ensure cart is loaded
    this.cartStore.initializeCart();
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    this.setItemUpdating(item.id, true);
    this.cartStore.updateItemQty(item.id, newQuantity, { silent: true });
    // Since the store method doesn't return observable, just reset updating state
    setTimeout(() => this.setItemUpdating(item.id, false), 500);
  }

  removeItem(item: CartItem): void {
    if (!confirm(`Remove ${item.titleSnap} from cart?`)) return;

    this.setItemUpdating(item.id, true);
    // Removal is a heavier action; keep existing loading UX (optional). If you want silent remove, pass opts in store similar to qty.
    this.cartStore.removeItem(item.id);
    // Since the store method doesn't return observable, just reset updating state
    setTimeout(() => this.setItemUpdating(item.id, false), 500);
  }

  clearCart(): void {
    if (!confirm('Clear all items from cart?')) return;
    this.cartStore.clearCart();
  }

  proceedToCheckout(): void {
    this.router.navigate(['/store/checkout']);
  }

  continueShopping(): void {
    this.router.navigate(['/store/products']);
  }

  getImageUrl(url: string): string {
    return this.googleDriveService.convertGoogleDriveUrl(url);
  }

  getItemTotal(item: CartItem): number {
    const price = parseFloat((item as any).unitPriceSnap ?? '0');
    return (isNaN(price) ? 0 : price) * item.qty;
  }

  getFormattedItemTotal(item: CartItem): string {
    return `₦${this.getItemTotal(item).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  getFormattedUnitPrice(item: CartItem): string {
    const price = parseFloat((item as any).unitPriceSnap ?? '0');
    const safe = isNaN(price) ? 0 : price;
    return `₦${safe.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  }

  private setItemUpdating(itemId: number, updating: boolean): void {
    this.isUpdating.update(state => ({
      ...state,
      [itemId]: updating
    }));
  }

  isItemUpdating(itemId: number): boolean {
    return this.isUpdating()[itemId] || false;
  }

  trackByItemId(index: number, item: CartItem): number {
    return item.id;
  }
}
