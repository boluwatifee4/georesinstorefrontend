import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { DeliveryZone } from '../../../types/api.types';
import { AdminDeliveryZonesService } from '../../../api/admin/delivery-zones/delivery-zones.service';

export interface DeliveryZonesState {
  deliveryZones: DeliveryZone[];
  currentDeliveryZone: DeliveryZone | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDeliveryZonesStore {
  private readonly deliveryZonesService = inject(AdminDeliveryZonesService);

  // State signals
  private state = signal<DeliveryZonesState>({
    deliveryZones: [],
    currentDeliveryZone: null,
    loading: false,
    error: null
  });

  // Computed signals
  readonly deliveryZones = computed(() => this.state().deliveryZones);
  readonly currentDeliveryZone = computed(() => this.state().currentDeliveryZone);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Actions
  loadDeliveryZones(): Observable<DeliveryZone[]> {
    this.updateState({ loading: true, error: null });

    return this.deliveryZonesService.getDeliveryZones().pipe(
      tap((deliveryZones: DeliveryZone[]) => {
        this.updateState({
          deliveryZones,
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to load delivery zones'
        });
        return of([]);
      })
    );
  }

  loadDeliveryZone(id: number): Observable<DeliveryZone> {
    this.updateState({ loading: true, error: null });

    return this.deliveryZonesService.getDeliveryZone(id).pipe(
      tap((deliveryZone: DeliveryZone) => {
        this.updateState({
          currentDeliveryZone: deliveryZone,
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to load delivery zone'
        });
        return of(null as any);
      })
    );
  }

  createDeliveryZone(deliveryZoneData: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>): Observable<DeliveryZone> {
    this.updateState({ loading: true, error: null });

    return this.deliveryZonesService.createDeliveryZone(deliveryZoneData).pipe(
      tap((newDeliveryZone: DeliveryZone) => {
        const currentZones = this.state().deliveryZones;
        this.updateState({
          deliveryZones: [newDeliveryZone, ...currentZones],
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to create delivery zone'
        });
        return of(null as any);
      })
    );
  }

  updateDeliveryZone(id: number, deliveryZoneData: Partial<DeliveryZone>): Observable<DeliveryZone> {
    this.updateState({ loading: true, error: null });

    return this.deliveryZonesService.updateDeliveryZone(id, deliveryZoneData).pipe(
      tap((updatedDeliveryZone: DeliveryZone) => {
        // Update the delivery zone in the list if it exists
        const currentZones = this.state().deliveryZones;
        const index = currentZones.findIndex(z => z.id === id);
        if (index !== -1) {
          currentZones[index] = updatedDeliveryZone;
          this.updateState({ deliveryZones: [...currentZones] });
        }

        // Update current delivery zone if it's the same
        if (this.state().currentDeliveryZone?.id === id) {
          this.updateState({ currentDeliveryZone: updatedDeliveryZone });
        }

        this.updateState({ loading: false });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to update delivery zone'
        });
        return of(null as any);
      })
    );
  }

  deleteDeliveryZone(id: number): Observable<void> {
    this.updateState({ loading: true, error: null });

    return this.deliveryZonesService.deleteDeliveryZone(id).pipe(
      tap(() => {
        // Remove the delivery zone from the list
        const currentZones = this.state().deliveryZones.filter(z => z.id !== id);
        this.updateState({
          deliveryZones: currentZones,
          loading: false
        });

        // Clear current delivery zone if it's the deleted one
        if (this.state().currentDeliveryZone?.id === id) {
          this.updateState({ currentDeliveryZone: null });
        }
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to delete delivery zone'
        });
        return of(void 0);
      })
    );
  }

  private updateState(updates: Partial<DeliveryZonesState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  reset(): void {
    this.state.set({
      deliveryZones: [],
      currentDeliveryZone: null,
      loading: false,
      error: null
    });
  }
}
