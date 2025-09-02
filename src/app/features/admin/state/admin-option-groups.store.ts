import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { AdminOptionGroupsService } from '../../../api/admin/option-groups/option-groups.service';
import { OptionGroup, Option } from '../../../types/api.types';
import { CreateOptionGroupRequest, AddOptionRequest } from '../../../api/admin/option-groups/option-groups.service';

export interface AdminOptionGroupsState {
  optionGroups: OptionGroup[];
  currentOptionGroup: OptionGroup | null;
  currentOptions: Option[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminOptionGroupsStore {
  private readonly optionGroupsService = inject(AdminOptionGroupsService);

  // Private signals
  private readonly _state = signal<AdminOptionGroupsState>({
    optionGroups: [],
    currentOptionGroup: null,
    currentOptions: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 20, total: 0 }
  });

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly optionGroups = computed(() => this._state().optionGroups);
  readonly currentOptionGroup = computed(() => this._state().currentOptionGroup);
  readonly currentOptions = computed(() => this._state().currentOptions);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);

  // Actions
  loadOptionGroups() {
    this.setLoading(true);
    this.optionGroupsService.getOptionGroups().pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load option groups');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        if (response.data) {
          this.setOptionGroups(response.data);
          this.setPagination({
            page: response.page,
            limit: response.limit,
            total: response.total
          });
        } else {
          const res = response as any
          this.setOptionGroups(res || []);
        }
      }
      this.setLoading(false);
    });
  }

  loadOptionGroup(id: number) {
    this.setLoading(true);
    this.optionGroupsService.getOptionGroup(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load option group');
        return of(null);
      })
    ).subscribe(optionGroup => {
      if (optionGroup) {
        this.setCurrentOptionGroup(optionGroup);
      }
      this.setLoading(false);
    });
  }

  loadOptions(groupId: number) {
    this.setLoading(true);
    this.optionGroupsService.getOptions(groupId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to load options');
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.setCurrentOptions(response.data);
      }
      this.setLoading(false);
    });
  }

  createOptionGroup(optionGroupData: CreateOptionGroupRequest) {
    this.setLoading(true);
    return this.optionGroupsService.createOptionGroup(optionGroupData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to create option group');
        return of(null);
      })
    );
  }

  addOption(groupId: number, optionData: AddOptionRequest) {
    this.setLoading(true);
    return this.optionGroupsService.addOption(groupId, optionData).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to add option');
        return of(null);
      })
    );
  }

  deleteOption(optionId: number) {
    this.setLoading(true);
    return this.optionGroupsService.deleteOption(optionId).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to delete option');
        return of(null);
      })
    );
  }

  deleteOptionGroup(id: number) {
    this.setLoading(true);
    return this.optionGroupsService.deleteOptionGroup(id).pipe(
      catchError(error => {
        this.setError(error.message || 'Failed to delete option group');
        return of(null);
      })
    );
  }

  clearCurrentOptionGroup() {
    this.setCurrentOptionGroup(null);
    this.setCurrentOptions([]);
  }

  clearError() {
    this.setError(null);
  }

  // Private state updaters
  private setOptionGroups(optionGroups: OptionGroup[]) {
    this._state.update(state => ({ ...state, optionGroups, error: null }));
  }

  private setCurrentOptionGroup(currentOptionGroup: OptionGroup | null) {
    this._state.update(state => ({ ...state, currentOptionGroup, error: null }));
  }

  private setCurrentOptions(currentOptions: Option[]) {
    this._state.update(state => ({ ...state, currentOptions, error: null }));
  }

  private setLoading(loading: boolean) {
    this._state.update(state => ({ ...state, loading }));
  }

  private setError(error: string | null) {
    this._state.update(state => ({ ...state, error }));
  }

  private setPagination(pagination: { page: number; limit: number; total: number }) {
    this._state.update(state => ({ ...state, pagination }));
  }
}
