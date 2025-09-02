import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AdminCategoriesService } from '../../../api/admin/categories/categories.service';
import { Category } from '../../../types/api.types';
import { CreateCategoryDto, UpdateCategoryDto } from '../../../api/dtos/api.dtos';

export interface AdminCategoriesState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesStore {
  private readonly categoriesService = inject(AdminCategoriesService);

  // Private signals
  private readonly _state = signal<AdminCategoriesState>({
    categories: [],
    currentCategory: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0 }
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly categories = computed(() => this._state().categories);
  readonly currentCategory = computed(() => this._state().currentCategory);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);

  // Actions
  loadCategories() {
    this.setLoading(true);
    this.categoriesService.getCategories().pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load categories');
        return of(null);
      })
    ).subscribe(response => {
      // console.log('Loaded categories response:', response);
      if (response) {
        this.setCategories(response.data);
        this.setPagination({
          page: response.page,
          limit: response.limit,
          total: response.total
        });
      }
      this.setLoading(false);
    });
  }

  loadCategory(id: number) {
    this.setLoading(true);
    this.categoriesService.getCategoryById(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load category');
        return of(null);
      })
    ).subscribe(category => {
      if (category) {
        this.setCurrentCategory(category);
      }
      this.setLoading(false);
    });
  }

  createCategory(categoryData: CreateCategoryDto) {
    this.setLoading(true);
    return this.categoriesService.createCategory(categoryData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to create category');
        return of(null);
      })
    );
  }

  updateCategory(id: number, categoryData: UpdateCategoryDto) {
    this.setLoading(true);
    return this.categoriesService.updateCategory(id, categoryData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to update category');
        return of(null);
      })
    );
  }

  deleteCategory(id: number) {
    this.setLoading(true);
    return this.categoriesService.deleteCategory(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to delete category');
        return of(null);
      })
    );
  }

  clearCurrentCategory() {
    this.setCurrentCategory(null);
  }

  // Private state updaters
  private setCategories(categories: Category[]) {
    this._state.update(state => ({ ...state, categories, error: null }));
  }

  private setCurrentCategory(currentCategory: Category | null) {
    this._state.update(state => ({ ...state, currentCategory }));
  }

  private setLoading(loading: boolean) {
    this._state.update(state => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update(state => ({ ...state, error }));
  }

  private setPagination(pagination: { page: number; limit: number; total: number }) {
    this._state.update(state => ({ ...state, pagination }));
  }
}
