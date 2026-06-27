import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { ADMIN_API_BASE_URL, ADMIN_API_KEY, BASE_API_URL } from './config/tokens/api.tokens';
import { PRERENDER_PRODUCTS_CACHE } from './core/interceptors/server-cache.interceptor';
import * as fs from 'fs';
import * as path from 'path';

// Read local products cache generated during build for prerendering
let cachedProducts: any[] = [];
try {
  const cachePath = path.join(process.cwd(), 'prerender-products.json');
  if (fs.existsSync(cachePath)) {
    cachedProducts = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    console.log(`[Server Config] Successfully loaded ${cachedProducts.length} products into prerender cache.`);
  } else {
    console.warn(`[Server Config] Prerender cache not found at: ${cachePath}`);
  }
} catch (e: any) {
  console.warn('[Server Config] Failed to read prerender products cache:', e.message);
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    { provide: BASE_API_URL, useValue: process.env['PUBLIC_API_URL'] ?? 'https://georesinstore-api.onrender.com' },
    { provide: ADMIN_API_BASE_URL, useValue: process.env['ADMIN_API_URL'] ?? (process.env['PUBLIC_API_URL'] ?? 'https://georesinstore-api.onrender.com') },
    { provide: ADMIN_API_KEY, useValue: process.env['ADMIN_API_KEY'] ?? 'changeme-dev-key' },
    { provide: PRERENDER_PRODUCTS_CACHE, useValue: cachedProducts }
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
