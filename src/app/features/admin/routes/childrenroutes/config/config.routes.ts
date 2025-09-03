import { Routes } from '@angular/router';

export const CONFIG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/config-mgt/app-config/app-config.component').then(m => m.AppConfigComponent),
  },
];
