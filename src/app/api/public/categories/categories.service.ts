import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { Category } from '../../../types/api.types';

@Injectable({ providedIn: 'root' })
export class PublicCategoriesService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * GET /categories - List all active categories
   */
  getCategories(): Observable<Category[]> {
    return this.apiHttp.get<Category[]>('categories');
  }

  /**
   * GET /categories/{slug} - Get category by slug with product count
   */
  getCategoryBySlug(slug: string): Observable<Category> {
    return this.apiHttp.get<Category>(`categories/${slug}`);
  }
}
