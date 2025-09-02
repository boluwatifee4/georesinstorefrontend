import { Routes } from '@angular/router';

export const VARIANT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/options-variants-mgt/products-variants/products-variants.component').then(m => m.ProductsVariantsComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('../../../pages/options-variants-mgt/variant-form/variant-form.component').then(m => m.VariantFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../../../pages/options-variants-mgt/variant-form/variant-form.component').then(m => m.VariantFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('../../../pages/options-variants-mgt/variant-form/variant-form.component').then(m => m.VariantFormComponent),
  },
];
