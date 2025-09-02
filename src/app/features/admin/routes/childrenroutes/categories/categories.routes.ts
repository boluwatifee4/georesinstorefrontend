import { Routes } from '@angular/router';

export const CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/categories-mgt/categories-list/categories-list.component').then(m => m.CategoriesListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('../../../pages/categories-mgt/categories-form/categories-form.component').then(m => m.CategoriesFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../../../pages/categories-mgt/categories-form/categories-form.component').then(m => m.CategoriesFormComponent),
  },
];
