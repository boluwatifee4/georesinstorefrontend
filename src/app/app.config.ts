import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { ADMIN_API_BASE_URL, ADMIN_API_KEY, BASE_API_URL } from './config/tokens/api.tokens';
import { adminAuthInterceptor } from './core/interceptors/admin-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([adminAuthInterceptor]),
      withFetch() // Use fetch API for SSR compatibility
    ),
    provideClientHydration(withEventReplay()),
    // Default client-side values; can be overridden by environment or runtime config
    { provide: BASE_API_URL, useValue: '/api' },
    { provide: ADMIN_API_BASE_URL, useExisting: BASE_API_URL },
    { provide: ADMIN_API_KEY, useValue: '' },
  ]
};
