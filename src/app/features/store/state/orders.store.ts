import { computed, inject, Injectable, signal } from '@angular/core';
import { PublicOrdersService } from '../../../api/public/orders/orders.service';
import {
  Order,
  OrderCreateRequest,
  DeclarePaymentRequest,
} from '../../../types/api.types';
import { catchError, of } from 'rxjs';

export interface OrdersState {
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ordersService = inject(PublicOrdersService);

  // Private signals
  private readonly _state = signal<OrdersState>({
    currentOrder: null,
    loading: false,
    error: null,
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly currentOrder = computed(() => this._state().currentOrder);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Actions
  saveOrder(request: OrderCreateRequest) {
    this.setLoading(true);
    this.ordersService
      .saveOrder(request)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to save order';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          // Order saved successfully, result contains orderCode and totals
          this.setError(null);
        }
        this.setLoading(false);
      });
  }

  declarePayment(request: DeclarePaymentRequest) {
    this.setLoading(true);
    this.ordersService
      .declarePayment(request)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to declare payment';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((result) => {
        if (result) {
          // Payment declared, result contains orderCode, bank details, and total
          this.setError(null);
        }
        this.setLoading(false);
      });
  }

  lookupOrder(orderCode: string) {
    this.setLoading(true);
    this.ordersService
      .lookupOrder(orderCode)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to lookup order';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((order) => {
        this.setCurrentOrder(order);
        this.setLoading(false);
      });
  }

  getOrder(orderCode: string) {
    this.setLoading(true);
    this.ordersService
      .getOrder(orderCode)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to get order';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((order) => {
        this.setCurrentOrder(order);
        this.setLoading(false);
      });
  }

  clearCurrentOrder() {
    this.setCurrentOrder(null);
  }

  // Private state updaters
  private setCurrentOrder(currentOrder: Order | null) {
    this._state.update((state) => ({ ...state, currentOrder }));
  }

  private setLoading(loading: boolean) {
    this._state.update((state) => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update((state) => ({ ...state, error }));
  }
}
