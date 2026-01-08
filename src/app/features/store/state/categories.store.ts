import { computed, inject, Injectable, signal } from '@angular/core';
import { PublicCategoriesService } from '../../../api/public/categories/categories.service';
import { Category } from '../../../types/api.types';
import { catchError, of } from 'rxjs';

export interface CategoriesState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriesStore {
  private readonly categoriesService = inject(PublicCategoriesService);

  // Private signals
  private readonly _state = signal<CategoriesState>({
    categories: [],
    currentCategory: null,
    loading: false,
    error: null,
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly categories = computed(() => this._state().categories);
  readonly currentCategory = computed(() => this._state().currentCategory);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Actions
  loadCategories() {
    this.setLoading(true);
    this.categoriesService
      .getCategories()
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to load categories';
          this.setError(msg);
          return of([]);
        })
      )
      .subscribe((categories) => {
        this.setCategories(categories);
        this.setLoading(false);
      });
  }

  loadCategoryBySlug(slug: string) {
    this.setLoading(true);
    this.categoriesService
      .getCategoryBySlug(slug)
      .pipe(
        catchError((error) => {
          const msg =
            error.error?.error?.message ||
            error.error?.message ||
            'Failed to load category';
          this.setError(msg);
          return of(null);
        })
      )
      .subscribe((category) => {
        this.setCurrentCategory(category);
        this.setLoading(false);
      });
  }

  clearCurrentCategory() {
    this.setCurrentCategory(null);
  }

  // Private state updaters
  private setCategories(categories: Category[]) {
    this._state.update((state) => ({ ...state, categories }));
  }

  private setCurrentCategory(currentCategory: Category | null) {
    this._state.update((state) => ({ ...state, currentCategory }));
  }

  private setLoading(loading: boolean) {
    this._state.update((state) => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update((state) => ({ ...state, error }));
  }
}
