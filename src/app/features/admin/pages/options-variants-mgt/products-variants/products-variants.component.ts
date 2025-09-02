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
  lucideSettings,
  lucideTriangleAlert,
  lucidePackage,
  lucideTag
} from '@ng-icons/lucide';

import { ProductVariant } from '../../../../../types/api.types';

@Component({
  selector: 'app-products-variants',
  standalone: true,
  imports: [CommonModule, NgIcon, FormsModule],
  providers: [provideIcons({
    lucideSearch,
    lucidePlus,
    lucidePencil,
    lucideTrash2,
    lucideEye,
    lucideSettings,
    lucideTriangleAlert,
    lucidePackage,
    lucideTag
  })],
  templateUrl: './products-variants.component.html',
  styleUrl: './products-variants.component.css'
})
export class ProductsVariantsComponent implements OnInit {
  private readonly router = inject(Router);

  // Component state
  searchQuery = signal('');
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Mock data for now - replace with actual service calls when backend is ready
  variants = signal<ProductVariant[]>([
    {
      id: 1,
      productId: 1,
      sku: 'TSHIRT-RED-M',
      price: '29.99',
      inventory: 15,
      isActive: true,
      imageUrl: null
    },
    {
      id: 2,
      productId: 1,
      sku: 'TSHIRT-RED-L',
      price: '29.99',
      inventory: 8,
      isActive: true,
      imageUrl: null
    },
    {
      id: 3,
      productId: 2,
      sku: 'JEANS-BLUE-32',
      price: '79.99',
      inventory: 5,
      isActive: true,
      imageUrl: null
    }
  ]);

  // Computed filtered variants
  filteredVariants = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const variantsList = this.variants();

    if (!query) return variantsList;

    return variantsList.filter(variant =>
      variant.sku.toLowerCase().includes(query) ||
      variant.price.includes(query)
    );
  });

  ngOnInit() {
    this.loadVariants();
  }

  loadVariants() {
    // TODO: Implement actual API call when backend is ready
    this.isLoading.set(true);

    // Simulate API call
    setTimeout(() => {
      this.isLoading.set(false);
    }, 500);
  }

  onSearchChange() {
    // Search is reactive through computed signal
  }

  onCreateVariant() {
    this.router.navigate(['/admin/variants/new']);
  }

  onEditVariant(variant: ProductVariant) {
    this.router.navigate(['/admin/variants', variant.id, 'edit']);
  }

  onViewVariant(variant: ProductVariant) {
    this.router.navigate(['/admin/variants', variant.id]);
  }

  onDeleteVariant(variant: ProductVariant) {
    if (!window.confirm(`Are you sure you want to delete variant "${variant.sku}"?`)) {
      return;
    }

    // TODO: Implement actual delete when service is ready
    this.variants.update(variants =>
      variants.filter(v => v.id !== variant.id)
    );

    toast.success(`Variant "${variant.sku}" deleted successfully`);
  }

  onToggleStatus(variant: ProductVariant) {
    // TODO: Implement actual status toggle when service is ready
    this.variants.update(variants =>
      variants.map(v =>
        v.id === variant.id
          ? { ...v, isActive: !v.isActive }
          : v
      )
    );

    const status = variant.isActive ? 'deactivated' : 'activated';
    toast.success(`Variant "${variant.sku}" ${status} successfully`);
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'text-red-600 bg-red-50';
    if (quantity <= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  }

  getStockStatusText(quantity: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
  }
}
