import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PublicOrdersService } from '../../../../api/public/orders/orders.service';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';

@Component({
  selector: 'app-order-lookup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-lookup.component.html',
  styleUrls: ['./order-lookup.component.css']
})
export class OrderLookupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(PublicOrdersService);
  private readonly router = inject(Router);
  private readonly googleDriveService = inject(GoogleDriveUtilService);

  // Form
  readonly lookupForm: FormGroup = this.fb.group({
    orderCode: ['', [Validators.required, Validators.minLength(3)]]
  });

  // State
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly order = signal<any>(null);

  lookupOrder(): void {
    if (this.lookupForm.invalid) return;

    const orderCode = this.lookupForm.value.orderCode.trim();
    this.isLoading.set(true);
    this.error.set(null);

    this.ordersService.lookupOrder(orderCode).subscribe({
      next: (order) => {
        this.order.set(order);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Order not found. Please check your order code.');
        this.isLoading.set(false);
        this.order.set(null);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/store']);
  }

  getImageUrl(url: string): string {
    return this.googleDriveService.convertGoogleDriveUrl(url);
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'saved': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
      case 'declared_paid': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20';
      case 'under_review': return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
      case 'confirmed': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'saved': return 'Order Saved';
      case 'declared_paid': return 'Payment Declared';
      case 'under_review': return 'Under Review';
      case 'confirmed': return 'Confirmed';
      case 'rejected': return 'Rejected';
      default: return status || 'Unknown';
    }
  }

  // Formatting helpers to keep template clean
  formatMoney(raw: string | number | null | undefined): string {
    if (raw === null || raw === undefined || raw === '') return '0.00';
    const num = typeof raw === 'number' ? raw : parseFloat(raw);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  lineTotal(unitPriceSnap: string, qty: number): string {
    const unit = parseFloat(unitPriceSnap);
    if (isNaN(unit)) return '0.00';
    return (unit * qty).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }
}
