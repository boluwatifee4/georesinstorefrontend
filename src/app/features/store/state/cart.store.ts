import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, EMPTY } from 'rxjs';
import { PublicCartService } from '../../../api/public/cart/cart.service';
import { Cart, CartItem } from '../../../types/api.types';

export interface CartState {
  cartId: string | null;
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly cartService = inject(PublicCartService);

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
    return this._state().items.reduce((sum, item) => {
      return sum + (parseFloat(item.unitPriceSnap) * item.qty);
    }, 0);
  });

  constructor() {
    // Auto-load cart when cartId changes
    toObservable(this.cartId).pipe(
      switchMap(cartId => {
        if (!cartId) return EMPTY;
        this.setLoading(true);
        return this.cartService.getCart(cartId).pipe(
          catchError(error => {
            this.setError(error.message || 'Failed to load cart');
            return of(null);
          })
        );
      })
    ).subscribe(cart => {
      if (cart) {
        this.setItems(cart.items);
      }
      this.setLoading(false);
    });
  }

  // Actions
  createCart() {
    this.setLoading(true);
    this.cartService.createCart().pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to create cart');
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.setCartId(result.cartId);
      }
      this.setLoading(false);
    });
  }

  addItem(variantId: number, qty: number) {
    const cartId = this.cartId();
    if (!cartId) {
      this.createCart();
      return;
    }

    this.setLoading(true);
    this.cartService.addItem(cartId, { variantId, qty }).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to add item');
        return of(null);
      })
    ).subscribe(item => {
      if (item) {
        this.addItemToState(item);
      }
      this.setLoading(false);
    });
  }

  updateItemQty(itemId: number, qty: number) {
    const cartId = this.cartId();
    if (!cartId) return;

    this.setLoading(true);
    this.cartService.updateItem(cartId, itemId, { qty }).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to update item');
        return of(null);
      })
    ).subscribe(item => {
      if (item) {
        this.updateItemInState(item);
      }
      this.setLoading(false);
    });
  }

  removeItem(itemId: number) {
    const cartId = this.cartId();
    if (!cartId) return;

    this.setLoading(true);
    this.cartService.removeItem(cartId, itemId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to remove item');
        return of(null);
      })
    ).subscribe(() => {
      this.removeItemFromState(itemId);
      this.setLoading(false);
    });
  }

  // Private state updaters
  private setCartId(cartId: string) {
    this._state.update(state => ({ ...state, cartId }));
  }

  private setItems(items: CartItem[]) {
    this._state.update(state => ({ ...state, items }));
  }

  private setLoading(loading: boolean) {
    this._state.update(state => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update(state => ({ ...state, error }));
  }

  private addItemToState(item: CartItem) {
    this._state.update(state => ({
      ...state,
      items: [...state.items, item]
    }));
  }

  private updateItemInState(updatedItem: CartItem) {
    this._state.update(state => ({
      ...state,
      items: state.items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      )
    }));
  }

  private removeItemFromState(itemId: number) {
    this._state.update(state => ({
      ...state,
      items: state.items.filter(item => item.id !== itemId)
    }));
  }
}
