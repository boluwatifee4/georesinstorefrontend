import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import {
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideEye,
  lucidePackage,
  lucideTag,
  lucideTriangleAlert,
  lucideLoader
} from '@ng-icons/lucide';

import { AdminProductsStore } from '../../../state/admin-products.store';
import { Product } from '../../../../../types/api.types';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, NgIcon, FormsModule],
  providers: [provideIcons({
    lucideSearch,
    lucidePlus,
    lucidePencil,
    lucideTrash2,
    lucideEye,
    lucidePackage,
    lucideTag,
    lucideTriangleAlert,
    lucideLoader
  })],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly productsStore = inject(AdminProductsStore);

  // Component state
  searchQuery = signal('');
  isLoading = signal(false);

  // Store signals
  readonly products = this.productsStore.products;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly pagination = this.productsStore.pagination;

  // Computed signals
  readonly filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.products();

    return this.products().filter(product =>
      product.title.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query))
    );
  });

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productsStore.loadProducts();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
  }

  onCreateProduct() {
    this.router.navigate(['/admin/products/new']);
  }

  onEditProduct(product: Product) {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  onViewProduct(product: Product) {
    this.router.navigate(['/admin/products', product.id]);
  }

  onDeleteProduct(product: Product) {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      return;
    }

    this.productsStore.deleteProduct(product.id).subscribe({
      next: (result) => {
        if (result !== null) {
          toast.success(`Product "${product.title}" deleted successfully`);
          this.loadProducts(); // Reload products
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
}
