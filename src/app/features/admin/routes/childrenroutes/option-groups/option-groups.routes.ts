import { Routes } from '@angular/router';

export const OPTION_GROUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../../../pages/options-variants-mgt/option-groups-list/option-groups-list.component').then(m => m.OptionGroupsListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('../../../pages/options-variants-mgt/option-group-form/option-group-form.component').then(m => m.OptionGroupFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('../../../pages/options-variants-mgt/option-group-form/option-group-form.component').then(m => m.OptionGroupFormComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('../../../pages/options-variants-mgt/option-group-form/option-group-form.component').then(m => m.OptionGroupFormComponent),
  },
];
