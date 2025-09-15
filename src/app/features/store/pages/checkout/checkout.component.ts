import { Component, computed, inject, OnInit, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartStore } from '../../state/cart.store';
import { PublicOrdersService, DeclarePaymentResponse, SaveOrderResponse } from '../../../../api/public/orders/orders.service';
import { ConfigService, ConfigResponse } from '../../../../api/public/config/config.service';
import { GoogleDriveUtilService } from '../../../../core/services/google-drive-util.service';
import { ReceiptGeneratorService } from '../../../../core/services/receipt-generator.service';
import { PaymentModalComponent } from '../../../../shared/components/payment-modal.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PaymentModalComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  private readonly cartStore = inject(CartStore);
  private readonly ordersService = inject(PublicOrdersService);
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly googleDriveService = inject(GoogleDriveUtilService);
  private readonly receiptGenerator = inject(ReceiptGeneratorService);
  private readonly platformId = inject(PLATFORM_ID);

  // Form
  readonly checkoutForm: FormGroup = this.fb.group({
    buyerName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)]],
    email: ['', [Validators.email]],
    whatsapp: ['', [Validators.pattern(/^[\+]?[0-9\-\(\)\s]+$/)]],
    locationLabel: ['', [Validators.required]],
    withinOgbomoso: [false]
  });

  // State
  readonly cartItems = this.cartStore.items;
  readonly subtotal = this.cartStore.subtotal;
  readonly cartId = this.cartStore.cartId;

  readonly isPlacingOrder = signal(false);
  readonly orderResult = signal<DeclarePaymentResponse | null>(null);
  readonly saveOrderResult = signal<SaveOrderResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly isSavingOrder = signal(false);
  readonly acknowledgeDelivery = signal(false); // User must acknowledge delivery fee notice
  readonly showPaymentModal = signal(false);
  readonly config = signal<ConfigResponse | null>(null);

  // Fixed delivery fee (only when NOT within Ogbomoso)
  readonly DELIVERY_FEE = 1000;

  // Computed properties
  readonly isEmpty = computed(() => this.cartItems().length === 0);
  private readonly _withinOgbomoso = signal(false);
  readonly withinOgbomoso = () => this._withinOgbomoso();
  readonly deliveryFee = computed(() => this.withinOgbomoso() ? 0 : this.DELIVERY_FEE);
  readonly total = computed(() => this.subtotal() + this.deliveryFee());

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

    // Sync withinOgbomoso control to signal so computed updates reliably
    const ctrl = this.checkoutForm.get('withinOgbomoso');
    ctrl?.valueChanges.subscribe(val => this._withinOgbomoso.set(!!val));
    // Initialize signal with initial control value
    this._withinOgbomoso.set(!!ctrl?.value);

    // Load config for payment details
    this.configService.getConfig().subscribe({
      next: (config) => this.config.set(config),
      error: (error) => {
        console.error('Failed to load config:', error);
        toast.error('Load Config failed');
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

    // Just open the modal now; API call will be triggered from modal confirm
    this.error.set(null);
    this.showPaymentModal.set(true);
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
        this.generateReceipt(result);
        // Clear cart after successful save
        if (isPlatformBrowser(this.platformId)) {
          try { localStorage.removeItem('cartId'); } catch { }
        }
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to save order. Please try again.';
        this.error.set(message);
        this.isSavingOrder.set(false);
        toast.error('Save Order failed');
      }
    });
  }

  goBackToCart(): void {
    this.router.navigate(['/store/cart']);
  }

  startNewOrder(): void {
    this.router.navigate(['/store/products']);
  }

  onPaymentModalClose(): void {
    this.showPaymentModal.set(false);
  }

  onPaymentConfirmed(result: DeclarePaymentResponse): void {
    // Save result from modal API call
    this.orderResult.set(result);
    this.showPaymentModal.set(false);
    this.generateReceipt(result);
    toast.success('Thank you! We will contact you shortly.');
    // Clear cart after success
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.removeItem('cartId'); } catch { }
      // Navigate to products then force a refresh (gives time for receipt download)
      setTimeout(() => {
        this.router.navigate(['/store/products']).then(() => {
          try { window.location.reload(); } catch { }
        });
      }, 800);
    }
  }

  generateReceipt(orderResult: DeclarePaymentResponse | SaveOrderResponse): void {
    try {
      const formValue = this.checkoutForm.value;
      const receiptData = {
        orderCode: orderResult.orderCode,
        customerName: formValue.buyerName || 'Customer',
        customerPhone: formValue.phone,
        customerEmail: formValue.email,
        customerWhatsapp: formValue.whatsapp,
        deliveryLocation: formValue.locationLabel || 'Not specified',
        items: this.cartItems(),
        subtotal: this.subtotal(),
        deliveryFee: this.DELIVERY_FEE,
        total: this.total(),
        date: new Date()
      };

      this.receiptGenerator.generateReceipt(receiptData);
    } catch (error) {
      console.error('Receipt generation failed:', error);
      toast.error('Receipt Generation failed');
    }
  }

  contactViaWhatsApp(): void {
    const config = this.config();
    if (config?.whatsappLink && isPlatformBrowser(this.platformId)) {
      try { window.open(config.whatsappLink, '_blank'); } catch { }
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
