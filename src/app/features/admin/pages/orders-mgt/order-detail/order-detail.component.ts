import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucidePackage,
  lucideUser,
  lucidePhone,
  lucideMail,
  lucideMapPin,
  lucideCalendar,
  lucideBanknote,
  lucideCheck,
  lucideX,
  lucideEye,
  lucideClock,
  lucideTriangleAlert
} from '@ng-icons/lucide';
import { Order } from '../../../../../types/api.types';
import { AdminOrdersStore } from '../../../state/admin-orders.store';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucidePackage,
      lucideUser,
      lucidePhone,
      lucideMail,
      lucideMapPin,
      lucideCalendar,
      lucideBanknote,
      lucideCheck,
      lucideX,
      lucideEye,
      lucideClock,
      lucideTriangleAlert
    })
  ],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.css'
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersStore = inject(AdminOrdersStore);

  // Store signals
  readonly order = this.ordersStore.currentOrder;
  readonly loading = this.ordersStore.loading;
  readonly error = this.ordersStore.error;

  // Local signals
  orderId = signal<number | null>(null);
  actionLoading = signal<boolean>(false);

  // Computed properties
  readonly canSetUnderReview = computed(() => {
    const order = this.order();
    return order?.status === 'DECLARED_PAID';
  });

  readonly canConfirm = computed(() => {
    const order = this.order();
    return order?.status === 'UNDER_REVIEW';
  });

  readonly canReject = computed(() => {
    const order = this.order();
    return order?.status === 'UNDER_REVIEW' || order?.status === 'DECLARED_PAID';
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id']);
      if (id) {
        this.orderId.set(id);
        this.loadOrder(id);
      }
    });
  }

  loadOrder(id: number): void {
    this.ordersStore.loadOrder(id).subscribe({
      next: () => {
        // Order loaded successfully
      },
      error: (error) => {
        console.error('Failed to load order:', error);
        toast.error('Failed to load order details');
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  onSetUnderReview(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.ordersStore.setUnderReview(order.id).subscribe({
      next: () => {
        toast.success('Order set to under review');
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to set under review:', error);
        toast.error('Failed to set order under review');
        this.actionLoading.set(false);
      }
    });
  }

  onConfirmOrder(): void {
    const order = this.order();
    if (!order) return;

    this.actionLoading.set(true);
    this.ordersStore.confirmOrder(order.id).subscribe({
      next: () => {
        toast.success('Order confirmed successfully');
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to confirm order:', error);
        toast.error('Failed to confirm order');
        this.actionLoading.set(false);
      }
    });
  }

  onRejectOrder(): void {
    const order = this.order();
    if (!order) return;

    const reason = prompt('Please provide a reason for rejecting this order:');
    if (!reason) return;

    this.actionLoading.set(true);
    this.ordersStore.rejectOrder(order.id, reason).subscribe({
      next: () => {
        toast.success('Order rejected');
        this.actionLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to reject order:', error);
        toast.error('Failed to reject order');
        this.actionLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DECLARED_PAID':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SAVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'DECLARED_PAID':
        return 'Payment Declared';
      case 'REJECTED':
        return 'Rejected';
      case 'SAVED':
        return 'Saved';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: string | null | undefined): string {
    if (!amount) return '₦0.00';
    return `₦${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}
