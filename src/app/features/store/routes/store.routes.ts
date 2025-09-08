import { Routes } from '@angular/router';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    children: [
      { path: '', loadComponent: () => import('../pages/store-home/store-home.component').then(m => m.StoreHomeComponent) },
      // future: products, cart etc under /store
    ]
  }
];
