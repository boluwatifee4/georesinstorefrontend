import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideEye,
  lucidePackage,
  lucideTag,
  lucideTriangleAlert,
  lucideLoader,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronsLeft,
  lucideChevronsRight,
  lucideX
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
    lucideLoader,
    lucideChevronLeft,
    lucideChevronRight,
    lucideChevronsLeft,
    lucideChevronsRight,
    lucideX
  })],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.css'
})
export class ProductsListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly productsStore = inject(AdminProductsStore);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Component state
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(20);
  isSearching = signal(false);
  activeFilter = signal<boolean | null>(null);
  featuredFilter = signal<boolean | null>(null);

  // Store signals
  readonly products = this.productsStore.products;
  readonly loading = this.productsStore.loading;
  readonly error = this.productsStore.error;
  readonly pagination = this.productsStore.pagination;

  // Computed signals for pagination
  readonly totalPages = computed(() => Math.ceil(this.pagination().total / this.pageSize()));
  readonly hasNextPage = computed(() => this.currentPage() < this.totalPages());
  readonly hasPreviousPage = computed(() => this.currentPage() > 1);
  readonly startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  readonly endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.pagination().total));

  // Remove the old filteredProducts computed since we'll use API filtering
  ngOnInit() {
    this.setupSearchDebounce();
    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(), // Only trigger if the search term changed
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.currentPage.set(1); // Reset to first page on new search
      this.loadProducts();
    });
  }

  loadProducts() {
    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined,
    };

    // Only add filters if they're not null
    if (this.activeFilter() !== null) {
      filters.isActive = this.activeFilter();
    }
    if (this.featuredFilter() !== null) {
      filters.featured = this.featuredFilter();
    };

    this.productsStore.loadProducts(filters);
  }

  onSearch(query: string) {
    this.isSearching.set(true);
    this.searchSubject.next(query);
    // Reset searching state after a short delay
    setTimeout(() => this.isSearching.set(false), 600);
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  onPreviousPage() {
    if (this.hasPreviousPage()) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  onNextPage() {
    if (this.hasNextPage()) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  onFirstPage() {
    this.onPageChange(1);
  }

  onLastPage() {
    this.onPageChange(this.totalPages());
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.currentPage.set(1); // Reset to first page
    this.loadProducts();
  }

  // Filter handling methods
  toggleActiveFilter(value: boolean | null) {
    if (this.activeFilter() === value) {
      this.activeFilter.set(null); // Reset filter if same value clicked
    } else {
      this.activeFilter.set(value);
    }
    this.currentPage.set(1); // Reset to first page
    this.loadProducts();
  }

  toggleFeaturedFilter(value: boolean | null) {
    if (this.featuredFilter() === value) {
      this.featuredFilter.set(null); // Reset filter if same value clicked
    } else {
      this.featuredFilter.set(value);
    }
    this.currentPage.set(1); // Reset to first page
    this.loadProducts();
  }

  // Helper methods for UI state
  isActiveFilterSelected(value: boolean | null): boolean {
    return this.activeFilter() === value;
  }

  isFeaturedFilterSelected(value: boolean | null): boolean {
    return this.featuredFilter() === value;
  }

  // Generate page numbers for pagination
  getPageNumbers(): number[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const delta = 2; // Show 2 pages before and after current page

    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    // Adjust range if near the beginning or end
    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(totalPages, start + 4);
      } else if (end === totalPages) {
        start = Math.max(1, end - 4);
      }
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
          this.loadProducts(); // Reload current page
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
  formatPrice(price: number | string | null | undefined): string {
    if (price === null || price === undefined || price === '') return 'N/A';
    if (typeof price === 'string') return price; // already formatted upstream
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  // Retry loading with current filters
  retryLoad(): void {
    this.loadProducts();
  }
}
