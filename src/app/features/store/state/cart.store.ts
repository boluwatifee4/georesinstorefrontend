import {
  computed,
  inject,
  Injectable,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, EMPTY } from 'rxjs';
import { PublicCartService } from '../../../api/public/cart/cart.service';
import { toast } from 'ngx-sonner';
import { Cart, CartItem } from '../../../types/api.types';
import { AddCartItemDto } from '../../../api/dtos/api.dtos';

export interface CartState {
  cartId: string | null;
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartService = inject(PublicCartService);
  private readonly platformId = inject(PLATFORM_ID);

  // Private signals
  private readonly _state = signal<CartState>({
    cartId: null,
    items: [],
    loading: false,
    error: null,
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly cartId = computed(() => this._state().cartId);
  readonly items = computed(() => this._state().items);
  readonly itemCount = computed(() => this._state().items.length);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Computed totals
  readonly subtotal = computed(() => {
    const parsePrice = (val: any): number => {
      if (val == null) return 0;
      let str = String(val).trim();
      if (!str) return 0;
      // Remove currency symbols & spaces
      str = str.replace(/[₦$€£¥]/g, '').trim();
      // Remove thousands separators (commas or spaces or underscores)
      str = str.replace(/[,\s_](?=\d{3}(\D|$))/g, '');
      // Keep only first decimal point
      const firstDot = str.indexOf('.');
      if (firstDot !== -1) {
        // Remove any subsequent dots
        str =
          str.slice(0, firstDot + 1) +
          str.slice(firstDot + 1).replace(/\./g, '');
      }
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };
    return this._state().items.reduce((sum, item) => {
      const raw =
        (item as any).unitPriceSnap ??
        (item as any).price ??
        (item as any).unitPrice;
      const price = parsePrice(raw);
      return sum + price * item.qty;
    }, 0);
  });

  constructor() {
    // Initialize cart from localStorage
    this.initializeCart();

    // Auto-load cart when cartId changes (Browser only)
    if (isPlatformBrowser(this.platformId)) {
      toObservable(this.cartId)
        .pipe(
          switchMap((cartId) => {
            if (!cartId) return EMPTY;
            this.setLoading(true);
            return this.cartService.getCart(cartId).pipe(
              catchError((error) => {
                const msg =
                  error.error?.error?.message ||
                  error.error?.message ||
                  'Failed to load cart';
                this.setError(msg);
                return of(null);
              })
            );
          })
        )
        .subscribe((cart) => {
          if (cart) {
            this.setItems(cart.items);
          }
          this.setLoading(false);
        });
    }
  }

  private showOperationFailedToast(message: string) {
    if (isPlatformBrowser(this.platformId)) {
      try {
        toast.error(message || 'Operation failed');
      } catch {
        /* ignore toast errors */
      }
    }
  }

  // Actions
  initializeCart() {
    // Try to load existing cartId from localStorage
    if (isPlatformBrowser(this.platformId)) {
      try {
        const savedCartId = localStorage.getItem('cartId');
        if (savedCartId) {
          this.setCartId(savedCartId);
        }
      } catch (err) {
        // Ignore storage access errors (e.g., SSR or privacy mode)
      }
    }
  }

  createCart(afterCreate?: () => void) {
    this.setLoading(true);
    this.cartService
      .createCart()
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to create cart';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          this.setCartId(result.id);
          if (isPlatformBrowser(this.platformId)) {
            try {
              localStorage.setItem('cartId', result.id);
            } catch {
              /* ignore storage errors */
            }
          }
          if (afterCreate) {
            // Execute callback safely after cart ID is set
            try {
              afterCreate();
            } catch (err) {
              /* swallow callback errors */
            }
          }
        }
        this.setLoading(false);
      });
  }

  /**
   * Flexible addItem API. Accepts any subset of { productId, productSlug, variantId, selectedOptions, qty }.
   * For backward compatibility you can still call with (variantId, qty: number).
   */
  addItem(
    arg1: number | AddCartItemDto,
    qty?: number,
    done?: (success: boolean) => void
  ) {
    const cartId = this.cartId();
    if (!cartId) {
      // Defer actual add until cart is created
      this.createCart(() => {
        this.addItem(arg1 as any, qty as any, done); // recursive call now that cartId exists
      });
      return;
    }

    // Normalize arguments
    let dto: AddCartItemDto;
    if (typeof arg1 === 'number') {
      dto = { variantId: arg1, qty: qty ?? 1 };
    } else {
      dto = arg1;
    }

    if (!dto.qty || dto.qty < 1) {
      dto.qty = 1;
    }

    this.setLoading(true);
    this.cartService
      .addItem(cartId, dto)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to add item';
          this.setError(msg);
          this.showOperationFailedToast(msg);
          if (done) done(false);
          return of(null);
        })
      )
      .subscribe((item) => {
        if (item) {
          this.addItemToState(item);
          // If price snapshot missing or not numeric, refresh full cart silently
          const needsRefresh =
            !item.unitPriceSnap || isNaN(parseFloat(item.unitPriceSnap as any));
          if (needsRefresh) {
            this.refreshCart(false);
          }
          if (done) done(true);
        } else {
          if (done) done(false);
        }
        this.setLoading(false);
      });
  }

  updateItemQuantity(itemId: number, qty: number, opts?: { silent?: boolean }) {
    return this.updateItemQty(itemId, qty, opts);
  }

  /**
   * Update item quantity.
   * Pass opts.silent=true to avoid toggling global loading state (used for inline +/- adjustments).
   */
  updateItemQty(
    itemId: number,
    qty: number,
    opts?: { silent?: boolean; done?: (success: boolean) => void }
  ) {
    const cartId = this.cartId();
    if (!cartId) return;
    const silent = !!opts?.silent;
    if (!silent) this.setLoading(true);
    this.cartService
      .updateItem(cartId, itemId, { qty })
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to update item';
          this.setError(msg);
          this.showOperationFailedToast(msg);
          if (opts?.done) {
            try {
              opts.done(false);
            } catch {
              /* ignore */
            }
          }
          return of(null);
        })
      )
      .subscribe((item) => {
        if (item) {
          this.updateItemInState(item);
          // Silent refresh to ensure any server-side recalculations (pricing, promos) are reflected
          this.refreshCart(false);
          if (opts?.done) {
            try {
              opts.done(true);
            } catch {
              /* ignore */
            }
          }
        } else {
          if (opts?.done) {
            try {
              opts.done(false);
            } catch {
              /* ignore */
            }
          }
        }
        if (!silent) this.setLoading(false);
      });
  }

  removeItem(itemId: number) {
    const cartId = this.cartId();
    if (!cartId) return;

    this.setLoading(true);
    this.cartService
      .removeItem(cartId, itemId)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to remove item';
          this.setError(msg);
          this.showOperationFailedToast(msg);
          this.setLoading(false);
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.removeItemFromState(itemId);
        this.setLoading(false);
      });
  }

  clearCart() {
    const cartId = this.cartId();
    if (!cartId) return;

    this.setLoading(true);
    this.cartService
      .clearCart(cartId)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to clear cart';
          this.setError(msg);
          this.showOperationFailedToast(msg);
          this.setLoading(false);
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.setItems([]);
        this.setLoading(false);
      });
  }

  /** Public method to force reloading cart items (silent by default) */
  refreshCart(showLoader = false) {
    const cartId = this.cartId();
    if (!cartId) return;
    if (showLoader) this.setLoading(true);
    this.cartService
      .getCart(cartId)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to refresh cart';
          this.setError(msg);
          // Do not toast refresh errors unless loader visible to avoid noise
          if (showLoader) this.showOperationFailedToast(msg);
          return of(null);
        })
      )
      .subscribe((cart) => {
        if (cart) this.setItems(cart.items);
        if (showLoader) this.setLoading(false);
      });
  }

  // Private state updaters
  private setCartId(cartId: string) {
    this._state.update((state) => ({ ...state, cartId }));
  }

  private setItems(items: CartItem[]) {
    this._state.update((state) => ({ ...state, items }));
  }

  private setLoading(loading: boolean) {
    this._state.update((state) => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update((state) => ({ ...state, error }));
  }

  private addItemToState(item: CartItem) {
    this._state.update((state) => ({
      ...state,
      items: [...state.items, item],
    }));
  }

  private updateItemInState(updatedItem: CartItem) {
    this._state.update((state) => ({
      ...state,
      items: state.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    }));
  }

  private removeItemFromState(itemId: number) {
    this._state.update((state) => ({
      ...state,
      items: state.items.filter((item) => item.id !== itemId),
    }));
  }
}
