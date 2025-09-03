import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin-login',
    loadComponent: () => import('./features/admin/pages/admin-login.component').then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/routes/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: 'store',
    loadChildren: () => import('./features/store/routes/store.routes').then(m => m.STORE_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'store' },
  { path: '**', redirectTo: 'store' },
];
