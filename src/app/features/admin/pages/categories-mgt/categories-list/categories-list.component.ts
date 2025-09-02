import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import {
  lucideSearch,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucideEye,
  lucideEllipsis,
  lucideLoader
} from '@ng-icons/lucide';
import { AdminCategoriesStore } from '../../../state/admin-categories.store';
import { Category } from '../../../../../types/api.types';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categories-list',
  imports: [CommonModule, NgIcon, FormsModule],
  providers: [provideIcons({
    lucideSearch,
    lucidePlus,
    lucidePencil,
    lucideTrash2,
    lucideEye,
    lucideEllipsis,
    lucideLoader
  })],
  templateUrl: './categories-list.component.html',
  styleUrl: './categories-list.component.css'
})
export class CategoriesListComponent implements OnInit {
  private readonly categoriesStore = inject(AdminCategoriesStore);
  private readonly router = inject(Router);

  // Component state
  searchQuery = '';
  showDeleteModal = false;
  categoryToDelete: Category | null = null;

  // Store signals
  readonly categories = this.categoriesStore.categories;
  readonly loading = this.categoriesStore.loading;
  readonly error = this.categoriesStore.error;


  // Computed filtered categories
  get filteredCategories() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.categories();

    return this.categories().filter(category =>
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query)
    );
  }

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoriesStore.loadCategories();
  }

  onCreateCategory() {
    this.router.navigate(['/admin/categories/new']);
  }

  onEditCategory(category: Category) {
    this.router.navigate(['/admin/categories', category.id, 'edit']);
  }

  onViewCategory(category: Category) {
    this.router.navigate(['/admin/categories', category.id]);
  }

  onDeleteCategory(category: Category) {
    this.categoryToDelete = category;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.categoryToDelete) return;

    const categoryName = this.categoryToDelete.name;

    this.categoriesStore.deleteCategory(this.categoryToDelete.id).subscribe({
      next: (result) => {
        if (result !== null) {
          // Success - reload categories
          this.loadCategories();
          this.closeDeleteModal();
          toast.success(`Category "${categoryName}" deleted successfully`);
        } else {
          // Failed but no error thrown
          toast.error(`Failed to delete category "${categoryName}"`);
          this.closeDeleteModal();
        }
      },
      error: (error) => {
        console.error('Failed to delete category:', error);
        toast.error(`Failed to delete category "${categoryName}": ${error.message || 'Unknown error'}`);
        this.closeDeleteModal();
      }
    });
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.categoryToDelete = null;
  }
}
