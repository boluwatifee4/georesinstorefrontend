import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { AppConfig } from '../../../types/api.types';
import { AdminConfigService, UpdateConfigRequest } from '../../../api/admin/config/config.service';

export interface AppConfigState {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminAppConfigStore {
  private readonly configService = inject(AdminConfigService);

  // State signals
  private state = signal<AppConfigState>({
    config: null,
    loading: false,
    error: null
  });

  // Computed signals
  readonly config = computed(() => this.state().config);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Actions
  loadConfig(): Observable<AppConfig> {
    this.updateState({ loading: true, error: null });

    return this.configService.getConfig().pipe(
      tap((config: AppConfig) => {
        this.updateState({
          config,
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to load app configuration'
        });
        return of(null as any);
      })
    );
  }

  updateConfig(configData: UpdateConfigRequest): Observable<AppConfig> {
    this.updateState({ loading: true, error: null });

    return this.configService.updateConfig(configData).pipe(
      tap((updatedConfig: AppConfig) => {
        this.updateState({
          config: updatedConfig,
          loading: false
        });
      }),
      catchError(error => {
        this.updateState({
          loading: false,
          error: error.error?.message || 'Failed to update app configuration'
        });
        return of(null as any);
      })
    );
  }

  private updateState(updates: Partial<AppConfigState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  reset(): void {
    this.state.set({
      config: null,
      loading: false,
      error: null
    });
  }
}
