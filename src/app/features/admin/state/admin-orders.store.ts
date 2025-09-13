import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { Order, OrderCreateRequest, DeclarePaymentRequest } from '../../../types/api.types';
import { AdminOrdersService, OrderListResponse } from '../../../api/admin/orders/orders.service';

export interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersStore {
  private readonly ordersService = inject(AdminOrdersService);

  // State signals
  private state = signal<OrdersState>({
    orders: [],
    currentOrder: null,
    loading: false,
    error: null
  });

  // Computed signals
  readonly orders = computed(() => this.state().orders);
  readonly currentOrder = computed(() => this.state().currentOrder);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Actions
  loadOrders(status?: string, q?: string, from?: string, to?: string): Observable<Order[]> {
    this.updateState({ loading: true, error: null });

    const filters: Record<string, any> = {};
    if (status) filters['status'] = status;
    if (q) filters['q'] = q;
    if (from) filters['from'] = from;
    if (to) filters['to'] = to;

    return this.ordersService.getOrders(filters).pipe(
      tap((response) => {
        this.updateState({
          orders: response.orders,
          loading: false
        });
      }),
      map((response) => response.orders),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to load orders'
        });
        return of([]);
      })
    );
  }

  loadOrder(id: number): Observable<Order> {
    this.updateState({ loading: true, error: null });

    return this.ordersService.getOrder(id).pipe(
      tap((order: Order) => {
        this.updateState({
          currentOrder: order,
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to load order'
        });
        return of(null as any);
      })
    );
  }

  updateOrderStatus(id: number, status: string, rejectReason?: string): Observable<Order> {
    this.updateState({ loading: true, error: null });

    let method: Observable<Order>;
    switch (status) {
      case 'under_review':
        method = this.ordersService.setUnderReview(id);
        break;
      case 'approved':
        method = this.ordersService.approveOrder(id);
        break;
      case 'rejected':
        method = this.ordersService.rejectOrder(id, { reason: rejectReason || '' });
        break;
      default:
        // For other status updates, we'll need to add methods to the service
        return of(null as any);
    }

    return method.pipe(
      tap((updatedOrder: Order) => {
        // Update the order in the list if it exists
        const currentOrders = this.state().orders;
        const index = currentOrders.findIndex(o => o.id === id);
        if (index !== -1) {
          currentOrders[index] = updatedOrder;
          this.updateState({ orders: [...currentOrders] });
        }

        // Update current order if it's the same
        if (this.state().currentOrder?.id === id) {
          this.updateState({ currentOrder: updatedOrder });
        }

        this.updateState({ loading: false });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to update order status'
        });
        return of(null as any);
      })
    );
  }

  createManualQuote(id: number, quoteData: { deliveryFee: number; total: number }): Observable<Order> {
    this.updateState({ loading: true, error: null });

    return this.ordersService.createManualQuote(id, quoteData).pipe(
      tap((updatedOrder: Order) => {
        // Update the order in the list if it exists
        const currentOrders = this.state().orders;
        const index = currentOrders.findIndex(o => o.id === id);
        if (index !== -1) {
          currentOrders[index] = updatedOrder;
          this.updateState({ orders: [...currentOrders] });
        }

        // Update current order if it's the same
        if (this.state().currentOrder?.id === id) {
          this.updateState({ currentOrder: updatedOrder });
        }

        this.updateState({ loading: false });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to create manual quote'
        });
        return of(null as any);
      })
    );
  }

  // Specific action methods for component convenience
  setUnderReview(id: number): Observable<Order> {
    return this.updateOrderStatus(id, 'under_review');
  }

  confirmOrder(id: number): Observable<Order> {
    return this.updateOrderStatus(id, 'approved');
  }

  rejectOrder(id: number, reason: string): Observable<Order> {
    return this.updateOrderStatus(id, 'rejected', reason);
  }

  private updateState(updates: Partial<OrdersState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  reset(): void {
    this.state.set({
      orders: [],
      currentOrder: null,
      loading: false,
      error: null
    });
  }
}
