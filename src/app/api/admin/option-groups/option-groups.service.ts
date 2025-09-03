import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { OptionGroup, Option } from '../../../types/api.types';
import { AdminListResponse } from '../../dtos/api.dtos';

export interface CreateOptionGroupRequest {
  name: string;
}

export interface AddOptionRequest {
  value: string;
  priceModifier: number;   // Price addition in kobo/cents
  inventory: number;       // Option-specific inventory
  isActive: boolean;       // Option availability
}

export interface UpdateOptionRequest {
  value?: string;
  priceModifier?: number;   // Price addition in kobo/cents
  inventory?: number;       // Option-specific inventory
  isActive?: boolean;       // Option availability
}

export interface AttachOptionGroupRequest {
  groupId: number;
  position?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOptionGroupsService {
  private readonly apiHttp = inject(ApiHttpService);

  /**
   * Create new option group
   */
  createOptionGroup(request: CreateOptionGroupRequest): Observable<OptionGroup> {
    return this.apiHttp.adminPost<OptionGroup>('/admin/option-groups', request);
  }

  /**
   * Get all option groups
   */
  getOptionGroups(): Observable<AdminListResponse<OptionGroup>> {
    return this.apiHttp.adminGet<AdminListResponse<OptionGroup>>('/admin/option-groups');
  }

  /**
   * Get specific option group
   */
  getOptionGroup(id: number): Observable<OptionGroup> {
    return this.apiHttp.adminGet<OptionGroup>(`/admin/option-groups/${id}`);
  }

  /**
   * Add option to group
   */
  addOption(groupId: number, request: AddOptionRequest): Observable<Option> {
    return this.apiHttp.adminPost<Option>(`/admin/option-groups/${groupId}/options`, request);
  }

  /**
   * Get options for group
   */
  getOptions(groupId: number): Observable<AdminListResponse<Option>> {
    return this.apiHttp.adminGet<AdminListResponse<Option>>(`/admin/option-groups/${groupId}/options`);
  }

  /**
   * Update option
   */
  updateOption(optionId: number, request: UpdateOptionRequest): Observable<Option> {
    return this.apiHttp.adminPatch<Option>(`/admin/options/${optionId}`, request);
  }

  /**
   * Delete option
   */
  deleteOption(optionId: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/options/${optionId}`);
  }

  /**
   * Delete option group
   */
  deleteOptionGroup(id: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/option-groups/${id}`);
  }

  /**
   * Attach option group to product
   */
  attachToProduct(productId: number, request: AttachOptionGroupRequest): Observable<void> {
    return this.apiHttp.adminPost<void>(`/admin/products/${productId}/option-groups`, request);
  }

  /**
   * Detach option group from product
   */
  detachFromProduct(productId: number, groupId: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/products/${productId}/option-groups/${groupId}`);
  }
}
