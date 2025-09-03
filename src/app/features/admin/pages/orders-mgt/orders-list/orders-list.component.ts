import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucidePlus,
  lucideSearch,
  lucideFile,
  lucideEye,
  lucidePackage,
  lucideClock,
  lucideCircle,
  lucideTriangle,
  lucideDollarSign
} from '@ng-icons/lucide';

import { AdminOrdersStore } from '../../../state/admin-orders.store';
import { Order } from '../../../../../types/api.types';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucidePlus,
    lucideSearch,
    lucideFile,
    lucideEye,
    lucidePackage,
    lucideClock,
    lucideCircle,
    lucideTriangle,
    lucideDollarSign
  })],
  templateUrl: './orders-list.component.html',
  styleUrl: './orders-list.component.css'
})
export class OrdersListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly ordersStore = inject(AdminOrdersStore);

  // Store signals
  readonly orders = this.ordersStore.orders;
  readonly loading = this.ordersStore.loading;
  readonly error = this.ordersStore.error;

  // Local signals
  searchForm: FormGroup;
  statusFilter = signal<string>('');
  searchQuery = signal<string>('');
  fromDate = signal<string>('');
  toDate = signal<string>('');

  constructor() {
    this.searchForm = this.fb.group({
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.ordersStore.loadOrders(this.statusFilter(), this.searchQuery(), this.fromDate(), this.toDate()).subscribe();
  }

  onSearch(): void {
    // Implement search functionality
    this.loadOrders();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.loadOrders();
  }

  onViewOrder(order: Order): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SAVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'SAVED':
        return 'Saved';
      case 'DECLARED_PAID':
        return 'Payment Declared';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'CONFIRMED':
        return 'Confirmed';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  }

  formatPrice(price: string): string {
    return `₦${parseFloat(price).toLocaleString()}`;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
