import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
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
  lucideTag,
  lucideDollarSign,
} from '@ng-icons/lucide';

import { AdminProductsStore } from '../../../state/admin-products.store';
import { Product } from '../../../../../types/api.types';
import {
  CreateProductRequest,
  UpdateProductRequest,
} from '../../../../../api/admin/products/products.service';

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideSave,
      lucideLoader,
      lucideTriangleAlert,
      lucidePackage,
      lucideTag,
      lucideDollarSign,
    }),
  ],
  templateUrl: './products-form.component.html',
  styleUrl: './products-form.component.css',
})
export class ProductsFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productsStore = inject(AdminProductsStore);

  // Component state
  productId = signal<number | null>(null);
  isEditMode = computed(() => this.productId() !== null);
  isLoading = signal(false);

  // Store signals
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly currentProduct = this.productsStore.currentProduct;

  // Form
  productForm: FormGroup;

  constructor() {
    // Initialize product form
    this.productForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(200),
        ],
      ],
      description: ['', [Validators.maxLength(2000)]],
      isActive: [true],
      featured: [false],
      isEmpty: [false],
      metaTitle: ['', [Validators.maxLength(200)]],
      metaDescription: ['', [Validators.maxLength(500)]],
      basePrice: [null, [Validators.min(0)]],
      compareAtPrice: [null, [Validators.min(0)]],
      baseInventory: [null, [Validators.min(0)]],
    });

    // Effect to watch for currentProduct changes and update form
    effect(() => {
      const product = this.currentProduct();
      if (product && this.isEditMode()) {
        this.productForm.patchValue({
          title: product.title,
          description: product.description || '',
          isActive: product.isActive,
          featured: product.featured,
          isEmpty: product.isEmpty,
          metaTitle: product.metaTitle || '',
          metaDescription: product.metaDescription || '',
          basePrice: product.basePrice || null,
          compareAtPrice: product.compareAtPrice || null,
          baseInventory: product.baseInventory || null,
        });
      }
    });
  }

  ngOnInit() {
    // Get product ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      const productId = Number(id);
      this.productId.set(productId);
      this.loadProduct(productId);
    }
  }

  loadProduct(id: number) {
    this.productsStore.loadProduct(id);
  }

  onSave() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.productForm.value;

    if (this.isEditMode()) {
      // Update existing product
      const updateData: UpdateProductRequest = {
        title: formData.title,
        description: formData.description || undefined,
        isActive: formData.isActive,
        featured: formData.featured,
        isEmpty: formData.isEmpty,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        basePrice: formData.basePrice || undefined,
        baseInventory: formData.baseInventory || undefined,
      };

      this.productsStore
        .updateProduct(this.productId()!, updateData)
        .subscribe({
          next: (result) => {
            this.isLoading.set(false);
            if (result) {
              toast.success(`Product "${result.title}" updated successfully`);
              this.router.navigate(['/admin/products', result.id]);
            } else {
              toast.error('Failed to update product');
            }
          },
          error: (error) => {
            this.isLoading.set(false);
            console.error('Failed to update product:', error);
            toast.error(
              `Failed to update product: ${error.message || 'Unknown error'}`
            );
          },
        });
    } else {
      // Create new product
      const createData: CreateProductRequest = {
        title: formData.title,
        description: formData.description || undefined,
        isActive: formData.isActive,
        featured: formData.featured,
        isEmpty: formData.isEmpty,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        basePrice: formData.basePrice || undefined,
        baseInventory: formData.baseInventory || undefined,
      };

      this.productsStore.createProduct(createData).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          if (result) {
            toast.success(`Product "${result.title}" created successfully`);
            this.router.navigate(['/admin/products', result.id]);
          } else {
            toast.error('Failed to create product');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Failed to create product:', error);
          toast.error(
            `Failed to create product: ${error.message || 'Unknown error'}`
          );
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/admin/products']);
  }

  // Helper methods for form validation
  getFieldError(fieldName: string): string | null {
    const field = this.productForm.get(fieldName);
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
      if (field.errors['pattern'])
        return `${this.getFieldLabel(
          fieldName
        )} can only contain lowercase letters, numbers, and hyphens`;
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Product title',
      description: 'Description',
      metaTitle: 'Meta title',
      metaDescription: 'Meta description',
      basePrice: 'Base price',
      compareAtPrice: 'Compare at price',
      baseInventory: 'Base inventory',
    };
    return labels[fieldName] || fieldName;
  }
}
