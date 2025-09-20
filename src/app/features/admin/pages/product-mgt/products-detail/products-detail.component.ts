import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideArrowLeft,
  lucidePencil,
  lucideTrash2,
  lucidePlus,
  lucideX,
  lucideImage,
  lucideTag,
  lucideSettings,
  lucideLoader,
  lucideTriangleAlert,
  lucidePackage,
  lucideFolderOpen,
  lucideGrid3x3,
  lucideStar,
  lucideInfo,
  lucideTriangle
} from '@ng-icons/lucide';

import { AdminProductsStore } from '../../../state/admin-products.store';
import { AdminCategoriesStore } from '../../../state/admin-categories.store';
import { AdminOptionGroupsStore } from '../../../state/admin-option-groups.store';
import { Product, ProductMedia, Category, OptionGroup } from '../../../../../types/api.types';
import { GoogleDriveUtilService } from '../../../../../core/services/google-drive-util.service';

@Component({
  selector: 'app-products-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({
    lucideArrowLeft,
    lucidePencil,
    lucideTrash2,
    lucidePlus,
    lucideX,
    lucideImage,
    lucideTag,
    lucideSettings,
    lucideLoader,
    lucideTriangleAlert,
    lucidePackage,
    lucideFolderOpen,
    lucideGrid3x3,
    lucideStar,
    lucideInfo,
    lucideTriangle
  })],
  templateUrl: './products-detail.component.html',
  styleUrl: './products-detail.component.css'
})
export class ProductsDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productsStore = inject(AdminProductsStore);
  private readonly categoriesStore = inject(AdminCategoriesStore);
  private readonly optionGroupsStore = inject(AdminOptionGroupsStore);
  private readonly googleDriveUtil = inject(GoogleDriveUtilService);

  // Component state
  productId = signal<number | null>(null);
  isLoading = signal(false);
  attachingOptionGroup = signal(false);
  detachingOptionGroup = signal<number | null>(null); // Track which option group is being detached

  // Store signals
  readonly product = this.productsStore.currentProduct;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;

  // Related data
  readonly categories = this.categoriesStore.categories;
  readonly optionGroups = this.optionGroupsStore.optionGroups;

  // Forms
  mediaForm: FormGroup;
  categoryForm: FormGroup;
  optionGroupForm: FormGroup;

  constructor() {
    // Initialize forms
    this.mediaForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      alt: [''],
      position: [0, [Validators.min(0)]],
      isPrimary: [false]
    });

    this.categoryForm = this.fb.group({
      categoryId: [null, [Validators.required]]
    });

    this.optionGroupForm = this.fb.group({
      groupId: [null, [Validators.required]],
      position: [0, [Validators.min(0)]]
    });
  }

  ngOnInit() {
    // Get product ID from route params
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(Number(id))) {
      const productId = Number(id);
      this.productId.set(productId);
      this.loadProduct(productId);
      this.loadCategories();
      this.loadOptionGroups();
    }
  }

  loadProduct(id: number) {
    this.productsStore.loadProduct(id);
  }

  loadCategories() {
    this.categoriesStore.loadCategories();
  }

  loadOptionGroups() {
    this.optionGroupsStore.loadOptionGroups();
  }

  onEditProduct() {
    if (this.productId()) {
      this.router.navigate(['/admin/products', this.productId(), 'edit']);
    }
  }

  onDeleteProduct() {
    const product = this.product();
    if (!product) return;

    if (!window.confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      return;
    }

    this.productsStore.deleteProduct(product.id).subscribe({
      next: (result) => {
        if (result !== null) {
          toast.success(`Product "${product.title}" deleted successfully`);
          this.router.navigate(['/admin/products']);
        } else {
          toast.error(`Failed to delete product "${product.title}"`);
        }
      },
      error: (error) => {
        console.error('Failed to delete product:', error);
        toast.error(`Failed to delete product: ${error.message || 'Unknown error'}`);
      }
    });
  }

  // Media Management
  onImageUrlChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const url = input.value;

    if (url && this.googleDriveUtil.isGoogleDriveUrl(url)) {
      const convertedUrl = this.googleDriveUtil.convertGoogleDriveUrl(url);
      const fileId = this.googleDriveUtil.extractFileId(url);

      // Update the form control with the converted URL
      this.mediaForm.patchValue({ url: convertedUrl });

      // Show a toast notification to inform the user
      // toast.success('✅ Google Drive URL converted to direct image link!', {
      //   description: `File ID: ${fileId}`,
      //   duration: 4000
      // });

      // console.log('🔗 Google Drive URL Conversion:');
      // console.log('📋 Original URL:', url);
      // console.log('🔄 Converted URL:', convertedUrl);
      // console.log('🆔 File ID:', fileId);
    }
  }

  onAddMedia() {
    if (this.mediaForm.invalid || !this.productId()) {
      this.mediaForm.markAllAsTouched();
      return;
    }

    const formData = this.mediaForm.value;
    const mediaData: any = {
      url: formData.url,
      alt: formData.alt || undefined,
      position: formData.position,
      isPrimary: formData.isPrimary
    };

    this.productsStore.addMedia(this.productId()!, mediaData).subscribe({
      next: (result: any) => {
        if (result) {
          toast.success('Media added successfully');
          this.mediaForm.reset();
          this.loadProduct(this.productId()!); // Reload product to show new media
        } else {
          toast.error('Failed to add media');
        }
      },
      error: (error: any) => {
        console.error('Failed to add media:', error);
        toast.error(`Failed to add media: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onRemoveMedia(media: ProductMedia) {
    if (!window.confirm('Are you sure you want to remove this media?')) {
      return;
    }

    this.productsStore.removeMedia(this.productId()!, media.id).subscribe({
      next: (result: any) => {
        if (result !== null) {
          toast.success('Media removed successfully');
          this.loadProduct(this.productId()!); // Reload product to update media list
        } else {
          toast.error('Failed to remove media');
        }
      },
      error: (error: any) => {
        console.error('Failed to remove media:', error);
        toast.error(`Failed to remove media: ${error.message || 'Unknown error'}`);
      }
    });
  }

  // Category Management
  onAssignCategory() {
    if (this.categoryForm.invalid || !this.productId()) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const categoryId = Number(this.categoryForm.get('categoryId')?.value);
    this.productsStore.assignToCategory(this.productId()!, categoryId).subscribe({
      next: (result: any) => {
        if (result !== null) {
          toast.success('Product assigned to category successfully');
          this.categoryForm.reset({
            categoryId: null
          });
          this.loadProduct(this.productId()!); // Reload product to show new category
        } else {
          toast.error('Failed to assign to category');
        }
      },
      error: (error: any) => {
        console.error('Failed to assign to category:', error);
        toast.error(`Failed to assign to category: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onRemoveCategory(category: Category) {
    if (!window.confirm(`Remove product from category "${category.name}"?`)) {
      return;
    }

    this.productsStore.removeFromCategory(this.productId()!, category.id).subscribe({
      next: (result: any) => {
        if (result !== null) {
          toast.success(`Product removed from category "${category.name}"`);
          this.loadProduct(this.productId()!); // Reload product to update categories list
        } else {
          toast.error('Failed to remove from category');
        }
      },
      error: (error: any) => {
        console.error('Failed to remove from category:', error);
        toast.error(`Failed to remove from category: ${error.message || 'Unknown error'}`);
      }
    });
  }

  // Option Group Management
  onAttachOptionGroup() {
    if (this.optionGroupForm.invalid || !this.productId()) {
      this.optionGroupForm.markAllAsTouched();
      return;
    }

    const formData = this.optionGroupForm.value;
    const attachData = {
      groupId: Number(formData.groupId),
      position: formData.position
    };

    this.attachingOptionGroup.set(true);
    this.optionGroupsStore.attachToProduct(this.productId()!, attachData).subscribe({
      next: (result: any) => {
        // console.log('Attach Option Group Result:', result);
        this.attachingOptionGroup.set(false);
        if (result !== null) {
          toast.success('Option group attached successfully');
          this.optionGroupForm.reset({
            groupId: null,
            position: 0
          });
          this.loadProduct(this.productId()!); // Reload product to show new option group
        } else {
          toast.error('Failed to attach option group');
        }
      },
      error: (error: any) => {
        console.error('Failed to attach option group:', error);
        this.attachingOptionGroup.set(false);
        toast.error(`Failed to attach option group: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onDetachOptionGroup(optionGroup: OptionGroup) {
    if (!window.confirm(`Detach option group "${optionGroup.name}" from this product?`)) {
      return;
    }

    this.detachingOptionGroup.set(optionGroup.id);
    this.optionGroupsStore.detachFromProduct(this.productId()!, optionGroup.id).subscribe({
      next: (result: any) => {
        this.detachingOptionGroup.set(null);
        if (result === null) {
          toast.success(`Option group "${optionGroup.name}" detached successfully`);
          this.loadProduct(this.productId()!); // Reload product to update option groups list
        } else {
          toast.error('Failed to detach option group');
        }
      },
      error: (error: any) => {
        console.error('Failed to detach option group:', error);
        this.detachingOptionGroup.set(null);
        toast.error(`Failed to detach option group: ${error.message || 'Unknown error'}`);
      }
    });
  }

  onBack() {
    this.router.navigate(['/admin/products']);
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined) return 'N/A';
    return `₦${(price / 100).toFixed(2)}`;
  }

  getStatusBadgeClass(product: Product): string {
    if (!product.isActive) {
      return 'bg-red-100 text-red-800';
    }
    if (product.featured) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-green-100 text-green-800';
  }

  getStatusText(product: Product): string {
    if (!product.isActive) return 'Inactive';
    if (product.featured) return 'Featured';
    return 'Active';
  }

  // Form validation helpers
  getMediaFieldError(fieldName: string): string | null {
    const field = this.mediaForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} must be a valid URL`;
      if (field.errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['min'].min}`;
    }
    return null;
  }

  getCategoryFieldError(fieldName: string): string | null {
    const field = this.categoryForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Please select a category';
    }
    return null;
  }

  getOptionGroupFieldError(fieldName: string): string | null {
    const field = this.optionGroupForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Please select an option group';
      if (field.errors['min']) return 'Position must be at least 0';
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      url: 'Media URL',
      alt: 'Alt text',
      position: 'Position',
      categoryId: 'Category',
      groupId: 'Option Group'
    };
    return labels[fieldName] || fieldName;
  }
}
