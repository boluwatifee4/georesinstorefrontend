import { InjectionToken } from '@angular/core';

// Base API URL (public endpoints)
export const BASE_API_URL = new InjectionToken<string>('BASE_API_URL');

// Admin API key token (used by admin-only HTTP requests)
export const ADMIN_API_KEY = new InjectionToken<string>('ADMIN_API_KEY');

// Admin-specific base (if different host/path). If not provided, fall back to BASE_API_URL
export const ADMIN_API_BASE_URL = new InjectionToken<string>('ADMIN_API_BASE_URL');
