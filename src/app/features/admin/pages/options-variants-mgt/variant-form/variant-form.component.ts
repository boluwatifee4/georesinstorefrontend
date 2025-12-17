import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucideSave,
  lucideLoader,
  lucideTriangleAlert,
  lucidePackage,
} from '@ng-icons/lucide';

import { ProductVariant } from '../../../../../types/api.types';

@Component({
  selector: 'app-variant-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSave,
      lucideLoader,
      lucideTriangleAlert,
      lucidePackage,
    }),
  ],
  templateUrl: './variant-form.component.html',
  styleUrl: './variant-form.component.css',
})
export class VariantFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Component state
  variantId = signal<number | null>(null);
  isEditMode = computed(() => this.variantId() !== null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Current variant (for edit mode)
  currentVariant = signal<ProductVariant | null>(null);

  // Form
  variantForm: FormGroup;

  constructor() {
    // Initialize variant form
    this.variantForm = this.fb.group({
      productId: [1, [Validators.required, Validators.min(1)]], // Default to product 1, should be selectable
      sku: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
        ],
      ],
      price: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{2})?$/)]],
      compareAtPrice: [null],
      inventory: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      imageUrl: [''],
    });
  }

  ngOnInit() {
    // Get variant ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      const variantId = Number(id);
      this.variantId.set(variantId);
      this.loadVariant(variantId);
    }
  }

  loadVariant(id: number) {
    this.isLoading.set(true);

    // TODO: Replace with actual API call when backend is ready
    // Mock data for demonstration
    const mockVariants: ProductVariant[] = [
      {
        id: 1,
        productId: 1,
        sku: 'TSHIRT-RED-M',
        price: '29.99',
        inventory: 15,
        isActive: true,
        imageUrl: null,
      },
      {
        id: 2,
        productId: 1,
        sku: 'TSHIRT-RED-L',
        price: '29.99',
        inventory: 8,
        isActive: true,
        imageUrl: null,
      },
      {
        id: 3,
        productId: 2,
        sku: 'JEANS-BLUE-32',
        price: '79.99',
        inventory: 5,
        isActive: true,
        imageUrl: null,
      },
    ];

    setTimeout(() => {
      const variant = mockVariants.find((v) => v.id === id);
      if (variant) {
        this.currentVariant.set(variant);
        this.variantForm.patchValue({
          productId: variant.productId,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || null,
          inventory: variant.inventory,
          isActive: variant.isActive,
          imageUrl: variant.imageUrl || '',
        });
      } else {
        this.error.set('Variant not found');
      }
      this.isLoading.set(false);
    }, 500);
  }

  onSave() {
    if (this.variantForm.invalid) {
      this.variantForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.variantForm.value;

    // TODO: Replace with actual API calls when backend is ready
    setTimeout(() => {
      if (this.isEditMode()) {
        toast.success(`Variant "${formData.sku}" updated successfully`);
      } else {
        toast.success(`Variant "${formData.sku}" created successfully`);
      }

      this.isLoading.set(false);
      this.router.navigate(['/admin/variants']);
    }, 1000);
  }

  onCancel() {
    this.router.navigate(['/admin/variants']);
  }

  // Helper methods for form validation
  getFieldError(fieldName: string): string | null {
    const field = this.variantForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['minlength'].requiredLength
        } characters`;
      if (field.errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} must not exceed ${
          field.errors['maxlength'].requiredLength
        } characters`;
      if (field.errors['min'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          field.errors['min'].min
        }`;
      if (field.errors['pattern']) {
        if (fieldName === 'price')
          return 'Price must be a valid number (e.g., 29.99)';
        return `${this.getFieldLabel(fieldName)} format is invalid`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      productId: 'Product ID',
      sku: 'SKU',
      price: 'Price',
      compareAtPrice: 'Compare at price',
      inventory: 'Inventory',
      imageUrl: 'Image URL',
    };
    return labels[fieldName] || fieldName;
  }
}
