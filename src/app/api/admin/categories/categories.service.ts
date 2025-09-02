import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Category } from '../../../types/api.types';
import { CreateCategoryDto, UpdateCategoryDto, AdminListResponse } from '../../dtos/api.dtos';

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * POST /admin/categories - Create a new category
   */
  createCategory(dto: CreateCategoryDto): Observable<Category> {
    return this.apiHttp.adminPost<Category>('admin/categories', dto);
  }

  /**
   * GET /admin/categories - List all categories (admin view)
   */
  getCategories(): Observable<AdminListResponse<Category>> {
    return this.apiHttp.adminGet<AdminListResponse<Category>>('admin/categories');
  }

  /**
   * GET /admin/categories/{id} - Get category by ID
   */
  getCategoryById(id: number): Observable<Category> {
    return this.apiHttp.adminGet<Category>(`admin/categories/${id}`);
  }

  /**
   * PATCH /admin/categories/{id} - Update category
   */
  updateCategory(id: number, dto: UpdateCategoryDto): Observable<Category> {
    return this.apiHttp.adminPatch<Category>(`admin/categories/${id}`, dto);
  }

  /**
   * DELETE /admin/categories/{id} - Delete category
   */
  deleteCategory(id: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`admin/categories/${id}`);
  }
}
