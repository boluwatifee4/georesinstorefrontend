import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  itemsPerPage = signal<number>(12);

  // All orders (unfiltered from store)
  allOrders = computed(() => this.orders());

  // Filtered orders (for client-side pagination)
  filteredOrders = computed(() => {
    const all = this.allOrders();
    // Client-side filtering could be added here if needed
    return all;
  });

  // Paginated orders for display
  paginatedOrders = computed(() => {
    const filtered = this.filteredOrders();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

  // Expose Math for template
  Math = Math;

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      fromDate: [''],
      toDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const searchValue = this.searchQuery();
    const statusValue = this.statusFilter();
    const fromValue = this.fromDate();
    const toValue = this.toDate();

    this.ordersStore.loadOrders(
      statusValue,  // status parameter
      searchValue,  // q parameter (search query)
      fromValue,    // from parameter
      toValue       // to parameter
    ).subscribe({
      next: (orders) => {
        // Update pagination based on all orders
        this.totalItems.set(orders.length);
        this.totalPages.set(Math.ceil(orders.length / this.itemsPerPage()));
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
      }
    });
  }

  onSearch(): void {
    const searchValue = this.searchForm.get('search')?.value || '';
    this.searchQuery.set(searchValue);
    this.currentPage.set(1); // Reset to first page when searching
    this.loadOrders();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.currentPage.set(1); // Reset to first page when filtering
    this.loadOrders();
  }

  onDateFilterChange(): void {
    const fromValue = this.searchForm.get('fromDate')?.value || '';
    const toValue = this.searchForm.get('toDate')?.value || '';
    this.fromDate.set(fromValue);
    this.toDate.set(toValue);
    this.currentPage.set(1); // Reset to first page when filtering
    this.loadOrders();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadOrders();
  }

  get pages(): number[] {
    const totalPages = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    // Show pages around current page
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
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
