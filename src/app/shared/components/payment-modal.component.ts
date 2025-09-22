import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService, ConfigResponse } from '../../api/public/config/config.service';
import { PublicOrdersService, DeclarePaymentResponse } from '../../api/public/orders/orders.service';
import { TelegramNotificationService } from '../../core/services/telegram-notification.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

        <!-- Header -->
        <div class="p-6 border-b border-gray-200 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
            <button
              (click)="close()"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div *ngIf="loadingConfig()" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto"></div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Loading payment details...</p>
          </div>

          <div *ngIf="!loadingConfig() && config()" class="space-y-6">
            <!-- Amount -->
            <div class="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl p-4">
              <div class="text-center">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                <p class="text-2xl font-bold text-violet-600 dark:text-violet-400">{{ totalAmount() }}</p>
              </div>
            </div>

            <!-- Bank Details -->
            <div class="bg-gray-50 dark:bg-slate-700 rounded-xl p-4">
              <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Transfer to:</h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Bank Name:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ config()?.bankName }}</span>
                </div>
                <div class="flex justify-between items-center" *ngIf="config()?.accountName">
                  <span class="text-gray-600 dark:text-gray-400">Account Name:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ config()?.accountName }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Account Number:</span>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-medium text-gray-900 dark:text-white">{{ config()?.accountNumber }}</span>
                    <button
                      (click)="copyAccountNumber()"
                      class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="flex justify-between items-start">
                  <span class="text-gray-600 dark:text-gray-400">Reference:</span>
                  <div class="text-right">
                      <span class="font-mono text-sm text-gray-900 dark:text-white">{{ orderResponse()?.orderCode }}</span>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Use as payment reference</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h4 class="font-medium text-amber-800 dark:text-amber-200 mb-2">Instructions:</h4>
              <ol class="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                <li>1. Transfer the exact amount to the account above</li>
                <li>2. Use your order code as the payment reference</li>
                <li>3. Click "I have paid" below once payment is made</li>
                <li>4. You will be contacted immediately after payment confirmation</li>
              </ol>
            </div>

            <!-- Checkout Note -->
            <div *ngIf="config()?.checkoutNote" class="text-center text-sm text-gray-600 dark:text-gray-400 italic">
              "{{ config()?.checkoutNote }}"
            </div>
          </div>

          <div *ngIf="!loadingConfig() && !config()" class="text-center py-8">
            <p class="text-red-600 dark:text-red-400">Failed to load payment details. Please try again.</p>
            <button
              (click)="loadConfig()"
              class="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-200 dark:border-slate-700">
          <div class="flex gap-3">
            <button
              (click)="close()"
              class="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              (click)="confirmPayment()"
              [disabled]="declaring() || !config()"
              class="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ng-container *ngIf="!declaring() && !orderResponse()">I Have Paid</ng-container>
              <span *ngIf="declaring()" class="flex items-center justify-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
              <ng-container *ngIf="!declaring() && orderResponse()">Declared</ng-container>
            </button>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Use the order code as the transfer reference. Click only after payment.
          </p>
        </div>
      </div>
    </div>
  `
})
export class PaymentModalComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly ordersService = inject(PublicOrdersService);
  private readonly telegramService = inject(TelegramNotificationService);

  // Inputs
  // Inputs
  readonly totalAmount = input.required<string>();
  // Data needed to declare payment
  readonly cartId = input.required<string>();
  readonly buyerName = input.required<string>();
  readonly phone = input<string | undefined>();
  readonly email = input<string | undefined>();
  readonly whatsapp = input<string | undefined>();
  readonly locationLabel = input.required<string>();

  // Outputs
  readonly onClose = output<void>();
  readonly onPaymentConfirmed = output<any>();

  // State
  readonly config = signal<ConfigResponse | null>(null);
  readonly loadingConfig = signal(false);
  readonly confirming = signal(false);
  readonly declaring = signal(false); // API in progress
  readonly orderResponse = signal<DeclarePaymentResponse | null>(null);
  readonly declareError = signal<string | null>(null);

  constructor() { }

  ngOnInit(): void {
    // Only load bank details; user triggers declare on button click
    this.loadConfig();
  }

  loadConfig(): void {
    this.loadingConfig.set(true);
    this.configService.getConfig().subscribe({
      next: (config) => {
        this.config.set(config);
        this.loadingConfig.set(false);
      },
      error: (error) => {
        console.error('Failed to load config:', error);
        toast.error('Failed to load payment details');
        this.loadingConfig.set(false);
      }
    });
  }

  copyAccountNumber(): void {
    const accountNumber = this.config()?.accountNumber;
    if (accountNumber && navigator.clipboard) {
      navigator.clipboard.writeText(accountNumber).then(() => {
        toast.success('Account number copied!');
      }).catch(() => {
        toast.error('Failed to copy account number');
      });
    }
  }

  confirmPayment(): void {
    if (this.declaring()) return;
    this.orderResponse.set(null);
    this.declareError.set(null);
    this.declaring.set(true);
    const payload = {
      cartId: this.cartId(),
      buyerName: this.buyerName(),
      phone: this.phone() || undefined,
      email: this.email() || undefined,
      whatsapp: this.whatsapp() || undefined,
      locationLabel: this.locationLabel()
    } as const;

    this.ordersService.declarePayment(payload).subscribe({
      next: (res) => {
        this.orderResponse.set(res);
        this.declaring.set(false);
        toast.success('Payment declared');

        // Send Telegram notification
        this.sendTelegramNotification(res);

        this.onPaymentConfirmed.emit(res);
      },
      error: (err) => {
        console.error('Declare payment failed:', err);
        this.declareError.set(err.error?.message || 'Failed to declare payment');
        toast.error('Declare Payment failed');
        this.declaring.set(false);
      }
    });
  }

  private sendTelegramNotification(response: DeclarePaymentResponse): void {
    const telegramMessage = {
      orderCode: response.orderCode,
      buyerName: this.buyerName(),
      total: this.totalAmount(),
      phone: this.phone(),
      email: this.email(),
      declaredAt: new Date().toISOString()
    };

    this.telegramService.sendPaymentDeclaredNotification(telegramMessage).subscribe({
      next: () => {
        // console.log('Telegram notification sent successfully');
      },
      error: (error) => {
        console.error('Failed to send Telegram notification:', error);
        // Don't show error to user as this is not critical
      }
    });
  }

  close(): void { this.onClose.emit(); }
}
