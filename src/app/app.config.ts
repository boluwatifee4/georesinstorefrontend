import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { ADMIN_API_BASE_URL, BASE_API_URL } from './config/tokens/api.tokens';
import { adminAuthInterceptor } from './core/interceptors/admin-auth.interceptor';
import { environment } from '../environments/environment';
import { ICON_PROVIDERS } from './shared/icon';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([adminAuthInterceptor]),
      withFetch() // Use fetch API for SSR compatibility
    ),
    provideClientHydration(
      withEventReplay(),
      withHttpTransferCacheOptions({
        includePostRequests: true
      })
    ),
    // Use environment configuration
    { provide: BASE_API_URL, useValue: environment.apiUrl },
    { provide: ADMIN_API_BASE_URL, useExisting: BASE_API_URL },
    ICON_PROVIDERS
  ]
};
