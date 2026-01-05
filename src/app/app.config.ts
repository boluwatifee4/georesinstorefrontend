import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from '@angular/common/http';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { ADMIN_API_BASE_URL, BASE_API_URL } from './config/tokens/api.tokens';
import { adminAuthInterceptor } from './core/interceptors/admin-auth.interceptor';
import { noCacheInterceptor } from './core/interceptors/no-cache.interceptor';
import { ScrollService } from './core/services/scroll.service';
import { environment } from '../environments/environment';
import { ICON_PROVIDERS } from './shared/icon';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { AssistantModule } from '@foisit/angular-wrapper';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(
      withInterceptors([adminAuthInterceptor, noCacheInterceptor]),
      withFetch() // Use fetch API for SSR compatibility
    ),
    provideClientHydration(
      withEventReplay()
      // HTTP transfer cache is completely disabled to prevent stale data
    ),
    // Use environment configuration
    { provide: BASE_API_URL, useValue: environment.apiUrl },
    { provide: ADMIN_API_BASE_URL, useExisting: BASE_API_URL },
    ICON_PROVIDERS,
    ScrollService, // Provide scroll service globally
    // Image optimization configuration
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        // Handle Google Drive URLs
        if (config.src.startsWith('https://drive.google.com')) {
          return `${config.src}${config.src.includes('?') ? '&' : '?'}sz=${
            config.width || 400
          }`;
        }
        // Handle local assets
        return config.src;
      },
    },
    // Foisit AI Assistant
    importProvidersFrom(
      AssistantModule.forRoot({
        introMessage: "Hi! I'm GEO AI. How can I help you today?",
        enableSmartIntent: true,
        inputPlaceholder: "Hi! I'm GEO AI. How can I help you today?",
        floatingButton: {
          visible: false, // Disabled - using custom Geo AI launcher
          tooltip: 'Chat with us',
          position: { bottom: '30px', right: '30px' },
        },
        commands: [],
      })
    ),
  ],
};
