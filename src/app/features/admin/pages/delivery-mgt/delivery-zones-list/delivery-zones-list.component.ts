import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucidePlus,
  lucideMapPin,
  lucidePencil,
  lucideTrash2,
  lucideToggleLeft,
  lucideToggleRight,
  lucideDollarSign
} from '@ng-icons/lucide';

import { AdminDeliveryZonesStore } from '../../../state/admin-delivery-zones.store';
import { DeliveryZone } from '../../../../../types/api.types';

@Component({
  selector: 'app-delivery-zones-list',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [provideIcons({
    lucidePlus,
    lucideMapPin,
    lucidePencil,
    lucideTrash2,
    lucideToggleLeft,
    lucideToggleRight,
    lucideDollarSign
  })],
  templateUrl: './delivery-zones-list.component.html',
  styleUrl: './delivery-zones-list.component.css'
})
export class DeliveryZonesListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly deliveryZonesStore = inject(AdminDeliveryZonesStore);

  // Store signals
  readonly deliveryZones = this.deliveryZonesStore.deliveryZones;
  readonly loading = this.deliveryZonesStore.loading;
  readonly error = this.deliveryZonesStore.error;

  ngOnInit(): void {
    this.loadDeliveryZones();
  }

  loadDeliveryZones(): void {
    this.deliveryZonesStore.loadDeliveryZones().subscribe();
  }

  onCreateDeliveryZone(): void {
    this.router.navigate(['/admin/delivery-zones/new']);
  }

  onEditDeliveryZone(deliveryZone: DeliveryZone): void {
    this.router.navigate(['/admin/delivery-zones', deliveryZone.id, 'edit']);
  }

  onDeleteDeliveryZone(deliveryZone: DeliveryZone): void {
    if (confirm(`Are you sure you want to delete the delivery zone "${deliveryZone.name}"?`)) {
      this.deliveryZonesStore.deleteDeliveryZone(deliveryZone.id).subscribe({
        next: () => {
          toast.success('Delivery zone deleted successfully');
        },
        error: (error) => {
          toast.error('Failed to delete delivery zone');
        }
      });
    }
  }

  onToggleActive(deliveryZone: DeliveryZone): void {
    const newStatus = !deliveryZone.isActive;
    this.deliveryZonesStore.updateDeliveryZone(deliveryZone.id, { isActive: newStatus }).subscribe({
      next: () => {
        toast.success(`Delivery zone ${newStatus ? 'activated' : 'deactivated'} successfully`);
      },
      error: (error) => {
        toast.error('Failed to update delivery zone status');
      }
    });
  }

  formatPrice(price: string): string {
    return `₦${parseFloat(price).toLocaleString()}`;
  }

  getMatcherText(matcher: string): string {
    switch (matcher) {
      case 'CITY':
        return 'City';
      case 'STATE':
        return 'State';
      case 'CUSTOM':
        return 'Custom';
      default:
        return matcher;
    }
  }
}
