import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { ADMIN_API_BASE_URL, ADMIN_API_KEY, BASE_API_URL } from './config/tokens/api.tokens';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: BASE_API_URL, useValue: process.env['PUBLIC_API_URL'] ?? 'https://georesinstore-api.onrender.com' },
    { provide: ADMIN_API_BASE_URL, useValue: process.env['ADMIN_API_URL'] ?? (process.env['PUBLIC_API_URL'] ?? 'https://georesinstore-api.onrender.com') },
    { provide: ADMIN_API_KEY, useValue: process.env['ADMIN_API_KEY'] ?? 'changeme-dev-key' },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
