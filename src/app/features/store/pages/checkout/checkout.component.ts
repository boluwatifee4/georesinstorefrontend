import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { PublicDeliveryService, DeliveryQuoteResponse } from '../../../../api/public/delivery/delivery.service';
import { PublicOrdersService, DeclarePaymentResponse, SaveOrderResponse } from '../../../../api/public/orders/orders.service';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly deliveryService = inject(PublicDeliveryService);
  private readonly ordersService = inject(PublicOrdersService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly googleDriveService = inject(GoogleDriveUtilService);
  private readonly platformId = inject(PLATFORM_ID);

  // Form
  readonly checkoutForm: FormGroup = this.fb.group({
    buyerName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)]],
    email: ['', [Validators.email]],
    whatsapp: ['', [Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)]],
    locationLabel: ['', [Validators.required]]
  });

  // State
  readonly cartItems = this.cartStore.items;
  readonly subtotal = this.cartStore.subtotal;
  readonly cartId = this.cartStore.cartId;

  readonly deliveryQuote = signal<DeliveryQuoteResponse | null>(null);
  readonly isLoadingDelivery = signal(false);
  readonly isPlacingOrder = signal(false);
  readonly orderResult = signal<DeclarePaymentResponse | null>(null);
  readonly saveOrderResult = signal<SaveOrderResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly isSavingOrder = signal(false);
  readonly acknowledgeDelivery = signal(false); // User must acknowledge potential delivery fee adjustments

  // Computed properties
  readonly isEmpty = computed(() => this.cartItems().length === 0);
  readonly hasDeliveryFee = computed(() => {
    const quote = this.deliveryQuote();
    return quote && quote.fee && !quote.needsManualQuote;
  });
  readonly deliveryFee = computed(() => {
    const quote = this.deliveryQuote();
    return quote?.fee ? parseFloat(quote.fee) : 0;
  });
  readonly total = computed(() => this.subtotal() + this.deliveryFee());
  readonly needsManualQuote = computed(() => this.deliveryQuote()?.needsManualQuote || false);

  // Formatted values
  readonly formattedSubtotal = computed(() =>
    `₦${this.subtotal().toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  );
  readonly formattedDeliveryFee = computed(() =>
    `₦${this.deliveryFee().toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  );
  readonly formattedTotal = computed(() =>
    `₦${this.total().toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
  );

  ngOnInit(): void {
    // Redirect if cart is empty
    if (this.isEmpty()) {
      this.router.navigate(['/store/cart']);
      return;
    }

    // Watch location changes for delivery quotes
    this.checkoutForm.get('locationLabel')?.valueChanges.subscribe(location => {
      if (location && location.trim().length > 2) {
        this.getDeliveryQuote(location.trim());
      } else {
        this.deliveryQuote.set(null);
      }
    });
  }

  private getDeliveryQuote(locationLabel: string): void {
    this.isLoadingDelivery.set(true);
    this.error.set(null);

    this.deliveryService.getQuote({ locationLabel }).subscribe({
      next: (quote) => {
        this.deliveryQuote.set(quote);
        this.isLoadingDelivery.set(false);
      },
      error: (error) => {
        this.error.set('Failed to get delivery quote. Please try again.');
        this.isLoadingDelivery.set(false);
        this.deliveryQuote.set(null);
      }
    });
  }

  declarePayment(): void {
    if (this.checkoutForm.invalid || !this.cartId()) return;

    // Must acknowledge delivery disclaimer first
    if (!this.acknowledgeDelivery()) {
      this.error.set('Please acknowledge the delivery fee notice before proceeding.');
      return;
    }

    // Validate contact info
    const formValue = this.checkoutForm.value;
    if (!formValue.phone && !formValue.email && !formValue.whatsapp) {
      this.error.set('Please provide at least one contact method (phone, email, or WhatsApp).');
      return;
    }

    this.isPlacingOrder.set(true);
    this.error.set(null);

    const request = {
      cartId: this.cartId()!,
      buyerName: formValue.buyerName,
      phone: formValue.phone || undefined,
      email: formValue.email || undefined,
      whatsapp: formValue.whatsapp || undefined,
      locationLabel: formValue.locationLabel
    };

    this.ordersService.declarePayment(request).subscribe({
      next: (result) => {
        this.orderResult.set(result);
        this.isPlacingOrder.set(false);
        // Clear cart after successful order
        if (isPlatformBrowser(this.platformId)) {
          try { localStorage.removeItem('cartId'); } catch { }
        }
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to place order. Please try again.');
        this.isPlacingOrder.set(false);
      }
    });
  }

  saveOrder(): void {
    if (!this.cartId()) return;

    if (!this.acknowledgeDelivery()) {
      this.error.set('Please acknowledge the delivery fee notice before proceeding.');
      return;
    }

    this.isSavingOrder.set(true);
    this.error.set(null);

    const locationLabel = this.checkoutForm.get('locationLabel')?.value || undefined;
    const request = {
      cartId: this.cartId()!,
      locationLabel
    };

    this.ordersService.saveOrder(request).subscribe({
      next: (result) => {
        this.saveOrderResult.set(result);
        this.isSavingOrder.set(false);
        // Clear cart after successful save
        if (isPlatformBrowser(this.platformId)) {
          try { localStorage.removeItem('cartId'); } catch { }
        }
      },
      error: (error) => {
        this.error.set(error.error?.message || 'Failed to save order. Please try again.');
        this.isSavingOrder.set(false);
      }
    });
  }

  goBackToCart(): void {
    this.router.navigate(['/store/cart']);
  }

  startNewOrder(): void {
    this.router.navigate(['/store/products']);
  }

  contactViaWhatsApp(): void {
    const quote = this.deliveryQuote();
    if (quote?.whatsappLink && isPlatformBrowser(this.platformId)) {
      try { window.open(quote.whatsappLink, '_blank'); } catch { }
    }
  }

  getImageUrl(url: string): string {
    return this.googleDriveService.convertGoogleDriveUrl(url);
  }

  copyOrderCode(): void {
    const orderCode = this.orderResult()?.orderCode || this.saveOrderResult()?.orderCode;
    if (orderCode && isPlatformBrowser(this.platformId) && navigator?.clipboard) {
      navigator.clipboard.writeText(orderCode).catch(() => { });
    }
  }

  copyBankDetails(): void {
    const result = this.orderResult();
    if (result && isPlatformBrowser(this.platformId) && navigator?.clipboard) {
      const details = `Bank: ${result.bankName}\nAccount: ${result.accountNumber}\nAmount: ${result.total}`;
      navigator.clipboard.writeText(details).catch(() => { });
    }
  }

  onAcknowledgeChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.acknowledgeDelivery.set(!!target?.checked);
  }

  trackByItemId(index: number, item: any): number {
    return item.id;
  }

  // Helpers for template formatting
  formatMoney(raw: string | number | null | undefined): string {
    if (raw === null || raw === undefined || raw === '') return '0.00';
    const num = typeof raw === 'number' ? raw : parseFloat(raw);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }

  lineItemTotal(item: any): string {
    const unit = parseFloat(item.unitPriceSnap);
    if (isNaN(unit)) return '0.00';
    return (unit * item.qty).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  }
}
