import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHttpService } from '../../../core/http/api-http.service';
import { OptionGroup, Option } from '../../../types/api.types';

export interface CreateOptionGroupRequest {
  name: string;
}

export interface AddOptionRequest {
  value: string;
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
  getOptionGroups(): Observable<OptionGroup[]> {
    return this.apiHttp.adminGet<OptionGroup[]>('/admin/option-groups');
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
  getOptions(groupId: number): Observable<Option[]> {
    return this.apiHttp.adminGet<Option[]>(`/admin/option-groups/${groupId}/options`);
  }

  /**
   * Delete option
   */
  deleteOption(optionId: number): Observable<void> {
    return this.apiHttp.adminDelete<void>(`/admin/options/${optionId}`);
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
