import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PdfService } from '../../services/pdf.service';
import { InvoiceDetails, InvoiceItem } from '../../models/invoice.model';

@Component({
  selector: 'app-invoice-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="container mx-auto px-4 py-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Invoice Generator</h1>
          <p class="text-gray-600 mt-2">Create professional invoices with ease</p>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <!-- Form Section -->
          <div class="bg-white rounded-xl shadow-sm border">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Invoice Details</h2>
            </div>

            <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
              <!-- Basic Details Section -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  Basic Information
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Invoice Number *</label>
                    <input
                      type="text"
                      formControlName="invoiceNumber"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="INV-001">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Issue Date *</label>
                    <input
                      type="date"
                      formControlName="date"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Due Date *</label>
                    <input
                      type="date"
                      formControlName="dueDate"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  </div>
                </div>
              </div>

              <!-- Customer Details Section -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  Customer Information
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                    <input
                      type="text"
                      formControlName="customerName"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      formControlName="customerEmail"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="customer@example.com">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      formControlName="customerAddress"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Customer address..."></textarea>
                  </div>
                </div>
              </div>

              <!-- Items Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900 flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span class="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    Line Items
                  </h3>
                  <button
                    type="button"
                    (click)="addItem()"
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Add Item
                  </button>
                </div>

                <div formArrayName="items" class="space-y-4">
                  @for (item of items.controls; track $index) {
                    <div [formGroupName]="$index" class="bg-gray-50 rounded-lg p-4">
                      <div class="grid grid-cols-12 gap-4 items-end">
                        <div class="col-span-12 md:col-span-5">
                          <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                          <input
                            type="text"
                            formControlName="description"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Item description">
                        </div>

                        <div class="col-span-4 md:col-span-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">Qty *</label>
                          <input
                            type="number"
                            formControlName="quantity"
                            min="1"
                            (input)="updateItemAmount($index)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div class="col-span-4 md:col-span-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">Price *</label>
                          <input
                            type="number"
                            formControlName="price"
                            min="0"
                            (input)="updateItemAmount($index)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>

                        <div class="col-span-3 md:col-span-2">
                          <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                          <div class="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-900 font-medium">
                            {{ getItemAmount($index) | currency:'NGN':'symbol':'1.2-2' }}
                          </div>
                        </div>

                        <div class="col-span-1">
                          <button
                            type="button"
                            (click)="removeItem($index)"
                            [disabled]="items.length <= 1"
                            class="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-transparent">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Additional Costs -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-600 font-semibold text-sm">4</span>
                  </div>
                  Additional Costs
                </h3>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Cost</label>
                  <input
                    type="number"
                    formControlName="deliveryCost"
                    min="0"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00">
                </div>
              </div>

              <!-- Notes -->
              <div class="space-y-4">
                <h3 class="text-lg font-medium text-gray-900 flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-blue-600 font-semibold text-sm">5</span>
                  </div>
                  Additional Notes
                </h3>

                <textarea
                  formControlName="notes"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add payment terms, thank you message, or other notes..."></textarea>
              </div>

              <!-- Summary -->
              <div class="bg-gray-50 rounded-lg p-6 space-y-3">
                <div class="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span class="font-medium">{{ subtotal() | currency:'NGN':'symbol':'1.2-2' }}</span>
                </div>
                @if (deliveryCost() > 0) {
                  <div class="flex justify-between text-gray-700">
                    <span>Delivery Cost:</span>
                    <span class="font-medium">{{ deliveryCost() | currency:'NGN':'symbol':'1.2-2' }}</span>
                  </div>
                }
                <div class="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total:</span>
                  <span>{{ total() | currency:'NGN':'symbol':'1.2-2' }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-3">
                <button
                  type="button"
                  (click)="resetForm()"
                  class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Reset Form
                </button>
                <button
                  type="submit"
                  [disabled]="!invoiceForm.valid || isGenerating()"
                  class="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                  @if (isGenerating()) {
                    <div class="flex items-center justify-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating PDF...
                    </div>
                  } @else {
                    Generate Invoice PDF
                  }
                </button>
              </div>
            </form>
          </div>

          <!-- Preview Section -->
          <div class="bg-white rounded-xl shadow-sm border">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900">Invoice Preview</h2>
            </div>

            <div class="p-6">
              <div #invoicePreview class="invoice-preview-container">
                <div class="invoice-document bg-white" style="width: 21cm; min-height: 29.7cm; margin: 0 auto; padding: 2cm; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <div class="flex justify-between items-start mb-8">
                    <div class="company-info">
                      <img src="/logo.png" alt="Company Logo" class="h-16 mb-4">
                      <div class="text-sm text-gray-600">
                        <p>Your Company Name</p>
                        <p>123 Business Street</p>
                        <p>Lagos, Nigeria</p>
                        <p>Phone: +234 xxx xxxx xxx</p>
                      </div>
                    </div>
                    <div class="invoice-meta text-right">
                      <h1 class="text-4xl font-bold text-blue-600 mb-2">INVOICE</h1>
                      <div class="text-sm space-y-1">
                        <div><span class="font-medium">Invoice #:</span> {{ invoiceForm.get('invoiceNumber')?.value || 'Not Set' }}</div>
                        <div><span class="font-medium">Date:</span> {{ formatDate(invoiceForm.get('date')?.value || '') }}</div>
                        <div><span class="font-medium">Due Date:</span> {{ formatDate(invoiceForm.get('dueDate')?.value || '') }}</div>
                      </div>
                    </div>
                  </div>

                  <!-- Bill To -->
                  <div class="mb-8">
                    <h2 class="text-lg font-semibold text-gray-900 mb-3">Bill To:</h2>
                    <div class="bg-gray-50 p-4 rounded-lg">
                      <div class="font-medium text-lg">{{ invoiceForm.get('customerName')?.value || 'Customer Name' }}</div>
                      @if (invoiceForm.get('customerEmail')?.value) {
                        <div class="text-gray-600 mt-1">{{ invoiceForm.get('customerEmail')?.value }}</div>
                      }
                      @if (invoiceForm.get('customerAddress')?.value) {
                        <div class="text-gray-600 mt-1 whitespace-pre-line">{{ invoiceForm.get('customerAddress')?.value }}</div>
                      }
                    </div>
                  </div>

                  <!-- Items Table -->
                  <div class="mb-8">
                    <table class="w-full border-collapse">
                      <thead>
                        <tr class="border-b-2 border-gray-300">
                          <th class="text-left py-3 font-semibold text-gray-900">Description</th>
                          <th class="text-center py-3 font-semibold text-gray-900 w-20">Qty</th>
                          <th class="text-right py-3 font-semibold text-gray-900 w-24">Price</th>
                          <th class="text-right py-3 font-semibold text-gray-900 w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of items.controls; track $index) {
                          <tr class="border-b border-gray-200">
                            <td class="py-3 text-gray-900">{{ item.get('description')?.value || 'Item description' }}</td>
                            <td class="py-3 text-center text-gray-700">{{ item.get('quantity')?.value || 1 }}</td>
                            <td class="py-3 text-right text-gray-700">{{ item.get('price')?.value | currency:'NGN':'symbol':'1.2-2' }}</td>
                            <td class="py-3 text-right font-medium text-gray-900">{{ getItemAmount($index) | currency:'NGN':'symbol':'1.2-2' }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <!-- Totals -->
                  <div class="flex justify-end mb-8">
                    <div class="w-80">
                      <div class="space-y-2">
                        <div class="flex justify-between py-2">
                          <span class="text-gray-700">Subtotal:</span>
                          <span class="font-medium text-gray-900">{{ subtotal() | currency:'NGN':'symbol':'1.2-2' }}</span>
                        </div>
                        @if (deliveryCost() > 0) {
                          <div class="flex justify-between py-2">
                            <span class="text-gray-700">Delivery Cost:</span>
                            <span class="font-medium text-gray-900">{{ deliveryCost() | currency:'NGN':'symbol':'1.2-2' }}</span>
                          </div>
                        }
                        <div class="flex justify-between py-3 border-t-2 border-gray-300">
                          <span class="text-xl font-bold text-gray-900">Total:</span>
                          <span class="text-xl font-bold text-blue-600">{{ total() | currency:'NGN':'symbol':'1.2-2' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Notes -->
                  @if (invoiceForm.get('notes')?.value) {
                    <div class="border-t border-gray-200 pt-6">
                      <h3 class="font-semibold text-gray-900 mb-2">Notes:</h3>
                      <p class="text-gray-700 whitespace-pre-line">{{ invoiceForm.get('notes')?.value }}</p>
                    </div>
                  }

                  <!-- Footer -->
                  <div class="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                    <p>Thank you for your business!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-preview-container {
      max-height: 80vh;
      overflow-y: auto;
    }

    .invoice-document {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.5;
      color: #374151;
    }

    @media print {
      .invoice-document {
        box-shadow: none !important;
        margin: 0 !important;
      }
    }

    /* Ensure proper scaling for PDF generation */
    .invoice-document * {
      box-sizing: border-box;
    }

    .invoice-document table {
      border-collapse: collapse;
      width: 100%;
    }

    .invoice-document table th,
    .invoice-document table td {
      padding: 12px 8px;
      vertical-align: top;
    }
  `]
})
export class InvoiceGeneratorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pdfService = inject(PdfService);

  invoiceForm = this.fb.group({
    invoiceNumber: ['', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    dueDate: ['', Validators.required],
    customerName: ['', Validators.required],
    customerEmail: [''],
    customerAddress: [''],
    items: this.fb.array([this.createItem()]),
    notes: [''],
    deliveryCost: [0]
  });

  isGenerating = signal(false);

  // Computed values
  subtotal = computed(() => {
    return this.items.controls.reduce((sum, item) => {
      const quantity = item.get('quantity')?.value || 0;
      const price = item.get('price')?.value || 0;
      return sum + (quantity * price);
    }, 0);
  });

  deliveryCost = computed(() => {
    return this.invoiceForm.get('deliveryCost')?.value || 0;
  });

  total = computed(() => {
    return this.subtotal() + this.deliveryCost();
  });

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      amount: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  updateItemAmount(index: number): void {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const price = item.get('price')?.value || 0;
    item.patchValue({ amount: quantity * price }, { emitEvent: false });
  }

  getItemAmount(index: number): number {
    const item = this.items.at(index);
    const quantity = item.get('quantity')?.value || 0;
    const price = item.get('price')?.value || 0;
    return quantity * price;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  async onSubmit(): Promise<void> {
    if (this.invoiceForm.invalid) return;

    this.isGenerating.set(true);

    try {
      const invoiceData: InvoiceDetails = {
        ...this.invoiceForm.value,
        subtotal: this.subtotal(),
        total: this.total(),
        items: this.items.value
      } as InvoiceDetails;

      await this.pdfService.generateInvoicePDF(invoiceData);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      // You should show an error message to the user here
    } finally {
      this.isGenerating.set(false);
    }
  }

  resetForm(): void {
    this.invoiceForm.reset({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      deliveryCost: 0
    });

    // Reset items to a single empty item
    while (this.items.length) {
      this.items.removeAt(0);
    }
    this.items.push(this.createItem());
  }
}
